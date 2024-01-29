import createPromise from "@anio-js-core-foundation/create-promise"

export default function runPromisesInParallel(queue, max_parallel_promises, events = {}) {
	const all_done_promise = createPromise()

	let currently_running_promises = []
	let current_queue_index = 0
	let waiting_for_running_jobs_to_be_done = false
	let task_results = new Map()

	for (let i = 0; i < max_parallel_promises; ++i) {
		currently_running_promises.push(null)
	}

	const dispatchEvent = (event_name, task_id, ...args) => {
		let event_handler = null

		if (event_name === "run" && typeof events.onRun === "function") {
			event_handler = events.onRun
		} else if (event_name === "done" && typeof events.onDone === "function") {
			event_handler = events.onDone
		}

		if (typeof event_handler !== "function") return

		if ("async" in events && events.async) {
			setTimeout(event_handler, 0, task_id, ...args)
		} else {
			event_handler(task_id, ...args)
		}
	}

	const jobDone = (worker_id) => {
		// check if queue is empty
		if ((current_queue_index + 1) > queue.length) {
			if (waiting_for_running_jobs_to_be_done) return

			waiting_for_running_jobs_to_be_done = true

			//console.log("queue is empty, waiting for all other running jobs to be done")

			Promise.all(currently_running_promises).then(() => {
				if (task_results.size !== queue.length) {
					all_done_promise.reject(
						new Error(`${task_results.size} finished tasks != ${queue.length} queue tasks, this is a bug in the module.`)
					)

					return
				}

				all_done_promise.resolve(task_results)
			})

			return
		}

		// grab the next task from the queue
		const next_task = queue[current_queue_index]
		let task_id = current_queue_index

		//console.log("running task on worker", worker_id, currently_running_promises[worker_id])

		dispatchEvent("run", task_id)

		currently_running_promises[worker_id] = next_task().then((result) => {
			task_results.set(task_id, result)

			dispatchEvent("done", task_id, result)

			jobDone(worker_id)
		}).catch((error) => {
			task_results.set(task_id, error)

			dispatchEvent("done", task_id, error)

			jobDone(worker_id)
		})

		++current_queue_index
	}

	for (let i = 0; i < max_parallel_promises; ++i) {
		jobDone(i)
	}

	return all_done_promise.promise
}
