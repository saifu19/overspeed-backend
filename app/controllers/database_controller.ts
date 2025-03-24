import { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import pg from 'pg'

// Define types for database rows
interface ModelRow {
  Model: string
}

interface SizeRow {
  ModelSizeText: string
}

interface FanClassRow {
  FanClassText: string | null
  UpperRPMLimit: number
  WheelDiameter: number | null
}

export default class DatabaseController {
    /**
     * Get PostgreSQL client instance
     */
    private getClient() {
        const { Client } = pg
        return new Client({
            connectionString: `postgresql://postgres.vltxcovxrmgqzatkvnmo:${env.get('POSTGRES_PASSWORD')}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
        })
    }

    /**
     * Get all unique Model values
     */
    async getUniqueModels({ response }: HttpContext) {
        const client = this.getClient()
        await client.connect()
        try {
            const result = await client.query<ModelRow>(`
                SELECT DISTINCT "Model" 
                FROM centrifugal 
                WHERE "Model" IS NOT NULL 
                ORDER BY "Model"
            `)

            const models = result.rows.map((row: ModelRow) => row.Model)
            
            return response.status(200).json({
                success: true,
                models
            })
        } catch (error) {
            console.error('Error fetching unique models:', error)
            return response.status(500).json({
                success: false,
                message: 'Failed to fetch unique models',
                error: error.message
            })
        } finally {
            await client.end()
        }
    }

    /**
     * Get all unique ModelSizeText values for a given Model
     */
    async getUniqueSizes({ request, response }: HttpContext) {
        const client = this.getClient()
        await client.connect()
        try {
            const { model } = request.qs()

            if (!model) {
                return response.status(400).json({
                    success: false,
                    message: 'Model parameter is required'
                })
            }

            const result = await client.query<SizeRow>(`
                SELECT DISTINCT "ModelSizeText" 
                FROM centrifugal 
                WHERE "Model" = $1 AND "ModelSizeText" IS NOT NULL 
                ORDER BY "ModelSizeText"
            `, [model])

            const sizes = result.rows.map((row: SizeRow) => row.ModelSizeText)

            return response.status(200).json({
                success: true,
                model,
                sizes
            })
        } catch (error) {
            console.error('Error fetching unique sizes:', error)
            return response.status(500).json({
                success: false,
                message: 'Failed to fetch unique sizes',
                error: error.message
            })
        } finally {
            await client.end()
        }
    }

    /**
     * Get UpperRPMLimit and WheelDiameter for the highest FanClassText value
     * for a given Model and ModelSizeText
     */
    async getUpperRPMLimitAndDiameter({ request, response }: HttpContext) {
        const client = this.getClient()
        await client.connect()
        try {
            const { model, size } = request.qs()

            if (!model || !size) {
                return response.status(400).json({
                    success: false,
                    message: 'Both model and size parameters are required'
                })
            }

            const result = await client.query<FanClassRow>(`
                SELECT "FanClassText", "UpperRPMLimit", "WheelDiameter"
                FROM centrifugal
                WHERE "Model" = $1 AND "ModelSizeText" = $2 AND "UpperRPMLimit" IS NOT NULL
            `, [model, size])

            if (result.rows.length === 0) {
                return response.status(404).json({
                    success: false,
                    message: 'No data found for the given model and size'
                })
            }

            // If there's only one entry, return it
            if (result.rows.length === 1) {
                return response.status(200).json({
                    success: true,
                    model,
                    size,
                    fanClass: result.rows[0].FanClassText,
                    upperRPMLimit: result.rows[0].UpperRPMLimit,
                    wheelDiameter: result.rows[0].WheelDiameter
                })
            }

            // Sort entries by FanClassText using custom sorting logic
            const sortedEntries = this.sortByFanClassPriority(result.rows)
            
            // Get the highest priority entry
            const highestPriorityEntry = sortedEntries[0]

            return response.status(200).json({
                success: true,
                model,
                size,
                fanClass: highestPriorityEntry.FanClassText,
                upperRPMLimit: highestPriorityEntry.UpperRPMLimit,
                wheelDiameter: highestPriorityEntry.WheelDiameter
            })
        } catch (error) {
            console.error('Error fetching upper RPM limit and wheel diameter:', error)
            return response.status(500).json({
                success: false,
                message: 'Failed to fetch upper RPM limit and wheel diameter',
                error: error.message
            })
        } finally {
            await client.end()
        }
    }

    /**
     * Sort entries by FanClassText priority
     * Handles numeric values, Roman numerals, and special cases like K and K2
     */
    private sortByFanClassPriority(entries: FanClassRow[]) {
        // First, let's create a function to determine the type and value of FanClassText
        const getFanClassPriority = (fanClass: string | null) => {
            if (!fanClass || fanClass === '\\N') return { type: 'unknown', value: -1 }
            
            // Check if it's a number
            const numericValue = Number(fanClass)
            if (!isNaN(numericValue)) {
                return { type: 'numeric', value: numericValue }
            }
            
            // Check for Roman numerals
            const romanNumerals: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5 }
            if (romanNumerals[fanClass]) {
                return { type: 'roman', value: romanNumerals[fanClass] }
            }
            
            // Special case for K and K2
            if (fanClass === 'K') return { type: 'special', value: 1 }
            if (fanClass === 'K2') return { type: 'special', value: 2 }
            
            // For other alphabetic values, use the character code
            return { type: 'alphabetic', value: fanClass.charCodeAt(0) }
        }
        
        // Sort entries by UpperRPMLimit in descending order as a fallback
        const sortedByRPM = [...entries].sort((a, b) => {
            const aRPM = a.UpperRPMLimit || 0
            const bRPM = b.UpperRPMLimit || 0
            return bRPM - aRPM
        })
        
        // Now sort by FanClassText priority
        return sortedByRPM.sort((a, b) => {
            const aPriority = getFanClassPriority(a.FanClassText)
            const bPriority = getFanClassPriority(b.FanClassText)
            
            // If types are different, use RPM as the deciding factor
            if (aPriority.type !== bPriority.type) {
                return 0 // Keep the RPM-based order
            }
            
            // If types are the same, compare values
            return bPriority.value - aPriority.value
        })
    }
} 