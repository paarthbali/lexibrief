$t = @'
// Vercel entry point: every /api/* request (except /api/extract) is rewritten here, see vercel.json.
import app from "../server/src/app.js";

export default app;
'@
[IO.File]::WriteAllText("$PWD\api\index.js", $t)