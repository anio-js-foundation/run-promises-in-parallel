import runPromisesInParallel from "../src/index.mjs"

function delay(n) {
	return new Promise(resolve => setTimeout(resolve, n))
}

let queue = []
let tasks_done = 0

for (let i = 0; i < 25; ++i) {
	queue.push(
		async () => {
			await delay(100 * Math.random())

			if (i === 15) {
				throw new Error("oops")
			}

			return `task-result-${i}`
		}
	)
}

/**
 * results will contain a Map() with the result of each task.
 * If the task threw an error, the error will be placed instead of the return value
 * of the task.
 * 
 * Run 5 promises in parallel.
 */
let results = await runPromisesInParallel(queue, 5, {
	// flag whether events should be dispatched async or not
	// defaults to false
	async: false,

	// called when a task is about to be run
	onRun(task_id) {
		console.log("running task", task_id)
	},

	// called when a task is done
	onDone(task_id, result) {
		console.log("task done", task_id, result)
	}
})

for (let [task_id, result] of results) {
	console.log(
		task_id, result, result === `task-result-${task_id}`
	)
}
