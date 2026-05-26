async function handleStatus(req, res) {
  const { MessageSid, MessageStatus, To, From } = req.body;
  console.log(`[STATUS] ${MessageSid} → ${MessageStatus} (From: ${From}, To: ${To})`);
  res.status(200).send("OK");
}

module.exports = { handleStatus };
