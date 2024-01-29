# @anio-js-foundation/run-promises-in-parallel

Run multiple promises in parallel, using a queue to dispatch new tasks.

```js
import runPromisesInParallel from "@anio-js-foundation/run-promises-in-parallel"

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
 * Always run 5 promises in parallel.
 */
let results = await runPromisesInParallel(queue, 5)

for (let [task_id, result] of results) {
	console.log(
		task_id, result, result === `task-result-${task_id}`
	)
}
```
