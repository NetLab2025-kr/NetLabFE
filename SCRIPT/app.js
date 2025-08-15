import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()


app.use(express.urlencoded({ extended: true }));
app.use('/css', express.static(path.join(__dirname, '../assets/css')));
app.use('/assets', express.static(path.join(__dirname, '../assets')));
app.use('/JS', express.static(path.join(__dirname, '../PUBLIC/JS')));

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname, '../views/index.html'));
});

const PORT = 3000
app.listen(PORT,() => {
    console.log(`app is listening at http://localhost:${PORT}`)
});