require("dotenv").config();
const express = require('express');
const https = require('https');
const bodyParser = require('body-parser');
const { IPinfoWrapper } = require('node-ipinfo');
const axios = require('axios');

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const ipinfoToken = process.env.ACCESS_TOKEN;
const ipinfo = new IPinfoWrapper(ipinfoToken);


async function externalIp() {
    const response = await axios.get('https://api.ipify.org?format=json')
    return response.data.ip;
}

app.get('/',  (req, res) => {
    
  res.sendFile(__dirname + "/index.html");

    app.post("/", async function  (req, res) {
  
      const person = req.body.person;
      
      try {
        let Ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        if (Ip === '::1' || Ip === '127.0.0.1') {
            Ip = await externalIp();
        }

        
        const locationResponse = await ipinfo.lookupIp(Ip).catch((err)=> console.log("err"));
         console.log( locationResponse.city);

        const city = locationResponse.city;

        const url =" https://api.openweathermap.org/data/2.5/weather?q="+ city +"&appid="+process.env.CLIENT_ID
      
      https.get(url, function (response) {
      
      response.on("data", function(data){
      const weatherData = JSON.parse(data);
        const temp = weatherData.main.temp;

        const greeting = `Hello ${person}!, the temperature is ${temp}°C in ${city}`;

        res.send({
            client_ip: Ip,
            Location: city,
            greeting,
        });
        
       });
      });

     
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: 'Error Fetching Data'
        });
    }

});

});

app.listen(port, function () { console.log("server is running on port 3000")

});
