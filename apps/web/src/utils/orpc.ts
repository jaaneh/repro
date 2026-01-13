import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { ClientRetryPluginContext } from "@orpc/client/plugins"
import { ClientRetryPlugin, DedupeRequestsPlugin } from "@orpc/client/plugins"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"
import { QueryCache, QueryClient } from "@tanstack/react-query"
import type { AppRouterClient } from "@test-app/api/routers/index"
import { env } from "@test-app/env/web"
import { toast } from "sonner"

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error, query) => {
			toast.error(`Error: ${error.message}`, {
				action: {
					label: "retry",
					onClick: query.invalidate
				}
			})
		}
	})
})

interface ORPCClientContext extends ClientRetryPluginContext {}

const link = new RPCLink<ORPCClientContext>({
	url: `${env.VITE_SERVER_URL}/rpc`,
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include"
		})
	},
	plugins: [
		new DedupeRequestsPlugin({
			filter: ({ request }) => request.method === "GET",
			groups: [
				{
					condition: () => true,
					context: {}
				}
			]
		}),
		new ClientRetryPlugin({
			default: {
				retry: 2,
				retryDelay: 1000,
				shouldRetry: ({ error }) => {
					// Only retry on network errors, not 4xx client errors
					if (error instanceof Error && error.message.includes("fetch")) {
						return true
					}
					return false
				}
			}
		})
	]
})

const getORPCClient = () => {
	return createORPCClient(link) as AppRouterClient
}

export const client: AppRouterClient = getORPCClient()

export const orpc = createTanstackQueryUtils(client)
