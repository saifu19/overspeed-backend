import type { ApplicationService } from '@adonisjs/core/types'
import ExecutorManager from '#providers/executor_provider/index';

export default class ExecutorProvider {
	constructor(protected app: ApplicationService) { }

	/**
	 * Register bindings to the container
	 */
	register() {
		this.app.container.singleton('langchain/manager', () => {
			return new ExecutorManager();
		});
	}

	/**
	 * The container bindings have booted
	 */
	async boot() { }

	/**
	 * The application has been booted
	 */
	async start() { }

	/**
	 * The process has been started
	 */
	async ready() { }

	/**
	 * Preparing to shutdown the app
	 */
	async shutdown() { }
}