var express = require('express');
var app = express();
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');

var host = 'localhost';
var port = 27017;

var iap = require('in-app-purchase');

mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Connected!");
    //db.close();
});

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.listen(80, function() {
    console.log('Example app listening on port 80!');
});

var Schema = mongoose.Schema;

// S7 HACKATON 2021

var Place = new Schema({
    city: { type: String},
    lat: { type: Number, default: 0 },
    lon: { type: Number, default: 0 },
    photo_url: { type: String},
    name: { type: String},
    description: { type: String},
    category: { type: String},
    tags: { type: String},
    modified: { type: Date}
});
var PlaceModel = mongoose.model('Place', Place);

app.post('/api/getAllPlaces', function(req, res) {
    if(req.body.city == undefined){
        req.body.city = "Санкт-Петербург"
    }
    PlaceModel.find({ 'city': req.body.city }).
    sort('modified').
    limit(200).
    exec(function(err, items) {
        console.log("items = " + items);
        if (items) {
            // Шопинг => Шопинг
            // Ночная жизнь = Клубы и бары 
            // Наука и искусство,Красивые виды => Музеи
            // ,Природа => Природа
            // Еда, => Кафе и закусочные
            // Жилье => Жилье и отели
            // Городская среда, Исторические места, Архитектура => Прогулка
            // Транспорт => Транспорт
            for(item of items){
                if(item.category.indexOf('Ночная жизнь') != -1){
                    item.category = 'Бары'
                }
                if(item.category.indexOf('Наука и искусство') != -1 ||item.category.indexOf('Красивые виды') != -1){
                    item.category = 'Музеи'
                }
                if(item.category.indexOf('Еда') != -1){
                    item.category = 'Кафе'
                }
                if(item.category.indexOf('Жилье') != -1){
                    item.category = 'Жилье'
                }
                if(item.category.indexOf('Городская среда') != -1 || item.category.indexOf('Исторические места') != -1 || item.category.indexOf('Архитектура') != -1){
                    item.category = 'Прогулка'
                }
            }

            return res.send(items);
        } else {
            if (err) {
                return res.send({
                    error: err
                });
            }
            var response = {};
            return res.send(response);
        }
    });
});

app.post('/api/addPlace', function(req, res) {
    var place = new PlaceModel({
        city: req.body.city,
        lat: Number(req.body.lat),
        lon: Number(req.body.lon),
        photo_url: req.body.photo_url,
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        tags: req.body.tags,
        modified: new Date()
    });

    place.save(function(err) {
        if (err) {
            console.log(err);
            return res.send({ status: 'ERROR', response: "-1" });
        } else {
            return res.send({ status: 'OK', response: "1" });
        }
    });
});

app.post('/api/removePlaceByID', function(req, res) {
    PlaceModel.remove({ '_id': req.body.place_id }, function(err) {
        if (!err) {
            return res.send({ status: 'OK', response: "1" });
        } else {
            return res.send({ status: 'ERROR', response: "-1" });
        }
    });
});

app.post('/api/removeAllPlace', function(req, res) {
    PlaceModel.remove({}, function(err) {
        if (!err) {
            return res.send({ status: 'OK', response: "1" });
        } else {
            return res.send({ status: 'ERROR', response: "-1" });
        }
    });
});

app.post('/api/getCityInfoByNomad', function(req, res) {
    var istaUrl = "http://207.154.218.146/api/getCityByName";
    var params = {name: req.body.name};
    var request = require('request');
    request({url:istaUrl,
        method: "POST",
        json: true,   // <--Very important!!!
        body: params}, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("body: "+body)
            // var bodyJson = JSON.parse(body);
            return res.send(body);
        } else {
            console.log(response.statusCode);
            console.log(error);
            res.statusCode = 500;
            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/api/getCity', function(req, res) {
    req.body.lon, req.body.lat

    var istaUrl = "http://207.154.218.146/api/getCity";
    var params = {lon: req.body.lon, lat:req.body.lat};
    var request = require('request');
    request({url:istaUrl,
        method: "POST",
        json: true,   // <--Very important!!!
        body: params}, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            console.log("body: "+body)
            // var bodyJson = JSON.parse(body);
            return res.send(body);
        } else {
            console.log(response.statusCode);
            console.log(error);
            res.statusCode = 500;
            return res.send({ error: 'Server error' });
        }
    });
});
var fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

app.post('/api/addPlaceByUrl', async (req, res)=> {
    // var place = new PlaceModel({
    //     city: req.body.city,
    //     lat: Number(req.body.lat),
    //     lon: Number(req.body.lon),
    //     photo_url: req.body.photo_url,
    //     name: req.body.name,
    //     description: req.body.description,
    //     category: req.body.category,
    //     tags: req.body.tags,
    //     modified: new Date()
    // });
    var arrPlace = req.body.url.split("/")
    var placeName = arrPlace[arrPlace.length-2]+"_"+arrPlace[arrPlace.length-1]
    var jsonObject;
      try{
        const response = await fetch("https://www.s7.ru/S7WIknowTravelService/city/"+placeName+"/ru", { method: 'get', headers: {"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"} });
        const responseText = await response.text();
        jsonObject = JSON.parse(responseText);
        var places = []
        for (address of jsonObject.addresses){
            try{
                var tags = undefined
                for (item of address.tags){
                    if(tags == undefined){
                        tags = item.name
                    }else{
                        tags += ","+item.name
                    }
                }
                var category = address.categories[0].name
                var lat = address.coordinates.latitude
                var lon = address.coordinates.longitude
                var photo_id = address.photos[0].id
                var photo_url = "https://daauxcge0bfi7.cloudfront.net/photo/gallery/"+photo_id+"_960x1000.jpg"
                var name = address.title
                var description = address.body
                var city = address.city.name
                var place = new PlaceModel({
                    city: city,
                    lat: Number(lat),
                    lon: Number(lon),
                    photo_url: photo_url,
                    name: name,
                    description:  description,
                    category: category,
                    tags: tags,
                    modified: new Date()
                });

                place.save(function(err) {
                    if (err) {
                        console.log(err.message);
                        // return res.send({ status: 'ERROR', response: "-1" });
                    } else {
                        // return res.send({ status: 'OK', response: "1" });
                    }
                });
            }catch(err){
                console.log(err.message);
            }
        }
        

        return res.send(places);
      }catch(err){
        return res.send({ err: err.message });
      }
});

app.post('/api/getAllPlacesFromS7', async (req, res)=> {
    // var place = new PlaceModel({
    //     city: req.body.city,
    //     lat: Number(req.body.lat),
    //     lon: Number(req.body.lon),
    //     photo_url: req.body.photo_url,
    //     name: req.body.name,
    //     description: req.body.description,
    //     category: req.body.category,
    //     tags: req.body.tags,
    //     modified: new Date()
    // });
    // if(req.body.url == undefined || req.body.url.indexOf("adler") != -1){
    //     PlaceModel.find().
    //     sort('modified').
    //     limit(200).
    //     exec(function(err, items) {
    //         if (items) {
    //             return res.send(items);
    //         } else {
    //             if (err) {
    //                 return res.send({
    //                     error: err
    //                 });
    //             }
    //             var response = {};
    //             return res.send(response);
    //         }
    //     });
    //     return
    // }

    var arrPlace = req.body.url.split("/")
    var placeName = arrPlace[arrPlace.length-2]+"_"+arrPlace[arrPlace.length-1]
    var jsonObject;
      try{
        const response = await fetch("https://www.s7.ru/S7WIknowTravelService/city/"+placeName+"/ru", { method: 'get', headers: {"User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36"} });
        const responseText = await response.text();
        jsonObject = JSON.parse(responseText);
        var places = []
        for (address of jsonObject.addresses){
            try{
                var tags = undefined
                for (item of address.tags){
                    if(tags == undefined){
                        tags = item.name
                    }else{
                        tags += ","+item.name
                    }
                }
                var category = address.categories[0].name
                var lat = address.coordinates.latitude
                var lon = address.coordinates.longitude
                var photo_id = address.photos[0].id
                var photo_url = "https://daauxcge0bfi7.cloudfront.net/photo/gallery/"+photo_id+"_960x1000.jpg"
                var name = address.title
                var description = address.body
                var city = address.city.name
                places.push({ category: category, tags:tags,lat:lat,lon:lon,photo_url:photo_url,name:name,description:description,city:city })
            }catch(err){

            }
        }
        

        return res.send(places);
      }catch(err){
        return res.send({ err: err.message });
      }
});

// http://207.154.227.74/api/getCityInfoByNomad
// Params: name:'Sochi'
// response: {}

// http://207.154.227.74/api/getCity
// Params: lat:43.600004
//         lon:39.580032
// response: {}

// http://207.154.227.74/api/removePlaceByID
// Params: place_id:<_id>
// response: { status: 'OK', response: "1" })

// http://207.154.227.74/api/addPlace
// Params: lat:43.600004
//         lon:39.580032
//         photo_url:'https://sun9-27.userapi.com/impf/7Ml43j7jXVT8UbBkMqusyC2JdZ0pgg3mFbG1cw/55WsKnnC3lY.jpg'
//         name:'Название места'
//         description:'Очень длинное описание места'
//         tags:'достопримечательность,отдых'
// response: { status: 'OK', response: "1" })


// http://207.154.227.74/api/getAllPlaces
// response: [{
//     city: 'city',
//     lat: 'lat',
//     lon: 'lon',
//     photo_url: 'photo_url',
//     name: 'name',
//     description: 'description',
//     tags: 'tags',
//     modified: 'date'
// },{
//     city: 'city',
//     lat: 'lat',
//     lon: 'lon',
//     photo_url: 'photo_url',
//     name: 'name',
//     description: 'description',
//     tags: 'tags',
//     modified: 'date'
// }]


