import { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import { createClient } from '@vercel/kv'

export default class LogsController {
    /**
     * Initialize Vercel KV client
     */
    private kv = createClient({
        url: env.get('KV_REST_API_URL'),
        token: env.get('KV_REST_API_TOKEN'),
    })

    /**
     * Log calculation data to Vercel KV
     */
    async logCalculation({ request, response }: HttpContext) {
        try {
            const logData = request.body()
            const hasFeedback = !!logData.calculation.feedback
            const hasComments = !!logData.calculation.comments

            const logId = logData.logId || `calc_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`

            if (hasFeedback && logData.logId) {
                const existingLog = await this.kv.get(logId)

                if (existingLog) {
                    if (typeof existingLog === 'object' && existingLog !== null && 'calculation' in existingLog) {
                        const typedLog = existingLog as { calculation: { feedback?: string, comments?: string } };

                        typedLog.calculation.feedback = logData.calculation.feedback;

                        if (hasComments) {
                            typedLog.calculation.comments = logData.calculation.comments;
                        }

                        await this.kv.set(logId, typedLog);

                        await this.kv.zadd(`feedback_logs:${logData.calculation.feedback}`, {
                            score: Date.now(),
                            member: logId
                        });

                        // If there are comments, add to comments-specific logs
                        if (hasComments) {
                            await this.kv.zadd(`comments_logs:${logData.calculation.feedback}`, {
                                score: Date.now(),
                                member: logId
                            });
                        }

                        return response.status(200).json({
                            success: true,
                            message: 'Feedback added to existing calculation log',
                            logId
                        });
                    }
                }
            }

            await this.kv.set(logId, logData)

            // Also add to a time-sorted list for easier retrieval
            await this.kv.zadd('calculation_logs', {
                score: Date.now(),
                member: logId
            })

            // If there's user info, add to user-specific logs
            if (logData.user && logData.user !== 'anonymous') {
                await this.kv.zadd(`user_logs:${logData.user}`, {
                    score: Date.now(),
                    member: logId
                })
            }

            // If there's feedback, add to feedback-specific logs
            if (logData.calculation.feedback) {
                await this.kv.zadd(`feedback_logs:${logData.calculation.feedback}`, {
                    score: Date.now(),
                    member: logId
                })
                
                // If there are comments with feedback, add to comments-specific logs
                if (hasComments) {
                    await this.kv.zadd(`comments_logs:${logData.calculation.feedback}`, {
                        score: Date.now(),
                        member: logId
                    });
                }
            }

            return response.status(200).json({
                success: true,
                message: 'Calculation logged successfully',
                logId
            })
        } catch (error) {
            console.error('Error logging calculation:', error)
            return response.status(500).json({
                success: false,
                message: 'Failed to log calculation',
                error: error.message
            })
        }
    }

    /**
     * Get recent calculation logs
     */
    async getRecentLogs({ request, response }: HttpContext) {
        try {
            const { limit = 50, offset = 0 } = request.qs()

            // Get the most recent log IDs
            const logIds = await this.kv.zrange('calculation_logs', offset, offset + limit - 1, {
                rev: true // Reverse order to get newest first
            })

            // Fetch the actual log data for each ID
            const logs = await Promise.all(
                logIds.map(async (id) => {
                    const log = await this.kv.get(id as string)
                    // Check if log is an object before spreading
                    return { id, ...(typeof log === 'object' && log !== null ? log : {}) }
                })
            )

            return response.status(200).json({
                success: true,
                logs,
                count: logs.length,
                total: await this.kv.zcard('calculation_logs')
            })
        } catch (error) {
            console.error('Error fetching calculation logs:', error)
            return response.status(500).json({
                success: false,
                message: 'Failed to fetch calculation logs',
                error: error.message
            })
        }
    }

    /**
     * Get logs for a specific user
     */
    async getUserLogs({ request, response, params }: HttpContext) {
        try {
            const { username } = params
            const { limit = 50, offset = 0 } = request.qs()

            // Get the user's log IDs
            const logIds = await this.kv.zrange(`user_logs:${username}`, offset, offset + limit - 1, {
                rev: true // Reverse order to get newest first
            })

            // Fetch the actual log data for each ID
            const logs = await Promise.all(
                logIds.map(async (id) => {
                    const log = await this.kv.get(id as string)
                    // Check if log is an object before spreading
                    return { id, ...(typeof log === 'object' && log !== null ? log : {}) }
                })
            )

            return response.status(200).json({
                success: true,
                username,
                logs,
                count: logs.length,
                total: await this.kv.zcard(`user_logs:${username}`)
            })
        } catch (error) {
            console.error(`Error fetching logs for user:`, error)
            return response.status(500).json({
                success: false,
                message: 'Failed to fetch user logs',
                error: error.message
            })
        }
    }

    /**
     * Get feedback statistics
     */
    async getFeedbackStats({ response }: HttpContext) {
        try {
            const positiveCount = await this.kv.zcard('feedback_logs:positive')
            const negativeCount = await this.kv.zcard('feedback_logs:negative')
            const totalLogs = await this.kv.zcard('calculation_logs')

            return response.status(200).json({
                success: true,
                stats: {
                    positive: positiveCount,
                    negative: negativeCount,
                    total: totalLogs,
                    withFeedback: positiveCount + negativeCount,
                    withoutFeedback: totalLogs - (positiveCount + negativeCount),
                    positivePercentage: totalLogs > 0 ? (positiveCount / totalLogs) * 100 : 0,
                    negativePercentage: totalLogs > 0 ? (negativeCount / totalLogs) * 100 : 0,
                    feedbackRate: totalLogs > 0 ? ((positiveCount + negativeCount) / totalLogs) * 100 : 0
                }
            })
        } catch (error) {
            console.error('Error fetching feedback stats:', error)
            return response.status(500).json({
                success: false,
                message: 'Failed to fetch feedback statistics',
                error: error.message
            })
        }
    }

    /**
     * Get logs with specific feedback type
     */
    async getFeedbackLogs({ request, response, params }: HttpContext) {
        try {
            const { feedbackType } = params
            const { limit = 50, offset = 0 } = request.qs()

            if (!['positive', 'negative'].includes(feedbackType)) {
                return response.status(400).json({
                    success: false,
                    message: 'Invalid feedback type. Must be "positive" or "negative"'
                })
            }

            // Get the feedback log IDs
            const logIds = await this.kv.zrange(`feedback_logs:${feedbackType}`, offset, offset + limit - 1, {
                rev: true // Reverse order to get newest first
            })

            // Fetch the actual log data for each ID
            const logs = await Promise.all(
                logIds.map(async (id) => {
                    const log = await this.kv.get(id as string)
                    // Check if log is an object before spreading
                    return { id, ...(typeof log === 'object' && log !== null ? log : {}) }
                })
            )

            // Filter logs to include only those with comments
            const logsWithComments = logs.filter(log => 
                log && 
                typeof log === 'object' && 
                'calculation' in log && 
                typeof log.calculation === 'object' && 
                log.calculation !== null && 
                'comments' in log.calculation && 
                log.calculation.comments
            )

            return response.status(200).json({
                success: true,
                feedbackType,
                logs,
                logsWithComments,
                count: logs.length,
                commentsCount: logsWithComments.length,
                total: await this.kv.zcard(`feedback_logs:${feedbackType}`)
            })
        } catch (error) {
            console.error(`Error fetching logs for feedback type:`, error)
            return response.status(500).json({
                success: false,
                message: 'Failed to fetch feedback logs',
                error: error.message
            })
        }
    }
}