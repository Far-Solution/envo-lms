"use client"

import { useEffect } from "react"

declare global {
  interface Window {
    JitsiMeetExternalAPI: any
  }
}

interface Props {
  sessionId: string
  roomName: string
}

export default function JitsiEmbed({ sessionId, roomName }: Props) {
  useEffect(() => {
    const loadJitsiScript = () => {
      return new Promise<void>((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve()
          return
        }

        const script = document.createElement("script")
        script.src = "https://meet.jit.si/external_api.js"
        script.async = true
        script.onload = () => resolve()
        script.onerror = () => reject("Failed to load Jitsi API script")
        document.body.appendChild(script)
      })
    }

    const initJitsi = async () => {
      try {
        await loadJitsiScript()

        const tokenRes = await fetch("/api/get-access-token").then(r => r.json())
        const accessToken = tokenRes?.data?.access_token

        const jwtRes = await fetch("/api/jitsi-token", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ sessionId, roomName }),
        })

        const { token } = await jwtRes.json()

        const domain = process.env.NEXT_PUBLIC_JITSI_DOMAIN || "meet.jit.si"
        const options = {
          roomName,
          jwt: token,
          width: "100%",
          height: 600,
          parentNode: document.getElementById("jitsi-container"),
          configOverwrite: {},
          interfaceConfigOverwrite: {},
        }

        // @ts-ignore
        const api = new window.JitsiMeetExternalAPI(domain, options)
        api.addEventListener("videoConferenceJoined", () => {
          console.log("✅ Jitsi joined successfully")
        })
      } catch (error) {
        console.error("Jitsi initialization error:", error)
      }
    }

    initJitsi()
  }, [sessionId, roomName])

  return <div id="jitsi-container" style={{ height: "100vh" }} />
}
