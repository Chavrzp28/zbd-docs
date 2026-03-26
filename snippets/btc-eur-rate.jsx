export const BtcEurRate = () => {
  const [state, setState] = useState({
    status: "loading",
    rate: null,
    updatedAt: null,
    error: null,
  })
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    let isMounted = true

    const loadRate = async ({ preserveRate } = { preserveRate: false }) => {
      try {
        const response = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=BTC")

        if (!response.ok) {
          throw new Error(`Coinbase request failed with ${response.status}`)
        }

        const payload = await response.json()
        const eurRate = payload?.data?.rates?.EUR
        const parsedRate = Number(eurRate)

        if (!Number.isFinite(parsedRate)) {
          throw new Error("Coinbase response did not include a valid EUR rate")
        }

        if (!isMounted) {
          return
        }

        setState({
          status: "ready",
          rate: parsedRate,
          updatedAt: new Date(),
          error: null,
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setState((currentState) => ({
          status: preserveRate && currentState.rate ? "stale" : "error",
          rate: preserveRate ? currentState.rate : null,
          updatedAt: preserveRate ? currentState.updatedAt : null,
          error: error instanceof Error ? error.message : "Unable to load BTC/EUR rate",
        }))
      }
    }

    loadRate()

    const intervalId = setInterval(() => {
      loadRate({ preserveRate: true })
    }, 5 * 60 * 1000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [])

  useEffect(() => {
    const timerId = setInterval(() => {
      setNow(Date.now())
    }, 60 * 1000)

    return () => {
      clearInterval(timerId)
    }
  }, [])

  const formattedRate =
    typeof state.rate === "number"
      ? new Intl.NumberFormat("en-IE", {
          style: "currency",
          currency: "EUR",
          maximumFractionDigits: 2,
        }).format(state.rate)
      : null

  const minutesSinceUpdate = state.updatedAt
    ? Math.max(0, Math.floor((now - state.updatedAt.getTime()) / (60 * 1000)))
    : null

  return (
    <div className="not-prose my-6 rounded-2xl border border-zinc-950/10 bg-gradient-to-br from-white to-zinc-50 p-5 shadow-sm dark:border-white/10 dark:from-zinc-900 dark:to-zinc-950">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            Price Reference
          </p>
          <div aria-live="polite">
            {formattedRate ? (
              <p className="text-3xl font-semibold text-zinc-950 dark:text-white">{formattedRate}</p>
            ) : (
              <p className="text-3xl font-semibold text-zinc-500 dark:text-zinc-400">Loading rate...</p>
            )}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            1 BTC quoted in EUR
          </p>
        </div>

        <div className="text-sm text-zinc-600 dark:text-zinc-300 md:text-right">
          <p>{minutesSinceUpdate !== null ? `last updated: ${minutesSinceUpdate} min ago` : "Waiting for first update"}</p>
        </div>
      </div>

      {state.status === "stale" ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          Live refresh failed. Showing the last successfully loaded Coinbase rate.
        </p>
      ) : null}

      {state.status === "error" ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          Unable to load the Coinbase BTC/EUR rate right now. Try refreshing the page.
        </p>
      ) : null}
    </div>
  )
}
