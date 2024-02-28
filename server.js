import app from "./app.js";

const PORT=process.env.PORT
const HOSTNAME=process.env.HOSTNAME

app.listen(PORT,()=>{
    console.log(`App is live at http://${HOSTNAME}:${PORT}`)
})