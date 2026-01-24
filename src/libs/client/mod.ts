import { useEffect, useState } from "react";

export function useClient() {
  const [client, setClient] = useState(false)

  useEffect(() => {
    setClient(true)
  }, [])

  return client
}