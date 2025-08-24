const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, makeInMemoryStore } = require("@whiskeysockets/baileys")
const { Boom } = require("@hapi/boom")
const P = require("pino")

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info")
  const { version } = await fetchLatestBaileysVersion()

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: P({ level: "silent" })
  })

  sock.ev.on("creds.update", saveCreds)

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    const msg = messages[0]
    if (!msg.message || msg.key.fromMe) return

    const from = msg.key.remoteJid
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text

    // Rename command
    if (body?.startsWith("!rename ")) {
      await sock.sendMessage(from, { text: `Renamed to: ${body.slice(8)}` })
    }

    // Forward command
    if (body?.startsWith("!forward ")) {
      const jid = body.split(" ")[1]
      await sock.sendMessage(jid, { text: "This is a forwarded message." })
    }

    // Direct link command (demo)
    if (body?.startsWith("!download ")) {
      await sock.sendMessage(from, { text: "🔗 Here's your download link: " + body.split(" ")[1] })
    }
  })
}

startBot()