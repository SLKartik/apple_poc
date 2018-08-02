//# sourceURL=application.js

//
//  application.js
//  Ericsson-Concept
//
//  Created by mmp-testlab on 27/03/18.
//  Copyright © 2018 mmp-testlab. All rights reserved.
//

/*
 * This file provides an example skeletal stub for the server-side implementation 
 * of a TVML application.
 *
 * A javascript file such as this should be provided at the tvBootURL that is 
 * configured in the AppDelegate of the TVML application. Note that  the various 
 * javascript functions here are referenced by name in the AppDelegate. This skeletal 
 * implementation shows the basic entry points that you will want to handle 
 * application lifecycle events.
 */

/**
 * @description The onLaunch callback is invoked after the application JavaScript 
 * has been parsed into a JavaScript context. The handler is passed an object 
 * that contains options passed in for launch. These options are defined in the
 * swift or objective-c client code. Options can be used to communicate to
 * your JavaScript code that data and as well as state information, like if the 
 * the app is being launched in the background.
 *
 * The location attribute is automatically added to the object and represents 
 * the URL that was used to retrieve the application JavaScript.
 */
App.onLaunch = function(options) {
    baseURL = options.BASEURL
    getDocument('backend/templates/profile.xml'); //entry point of the pages
    loadJSON("backend/resources/json/info.json",prepJSON); //get all metadata related to movies
}


App.onWillResignActive = function() {

}

App.onDidEnterBackground = function() {

}

App.onWillEnterForeground = function() {
    
}

App.onDidBecomeActive = function() {
    
}

App.onWillTerminate = function() {
    
}

/*
 * variable
 */
var baseURL;
var passkeyData;
var favoriteButton;
var favoriteClass ="resource://button-rate";
var toggle;
var isTrueSet = false;
var isBuy = false;
var globalId;
var actual_JSON;
var produtJSON;
var imgLink;
var currentMediaDuration;
var idFlag = 2;
var refresher;
var refreshFlag;
var listidFlag = 8;
var metadata;  //contains the metadata fetched from the info.json


/*
 * functions - core functions that handle navigation and data request
 */

//handling selection of profile
function profileSelect(usr)
{
    var cur = getActiveDocument();
    if(usr=="Mike")
        getDocument('backend/templates/loginPage.xml');
    else
    {
        getDocument('backend/templates/home.xml');
        navigationDocument.removeDocument(cur);
    }
}
//loading user datails statically
function loadUserDetails() {
    loadJSON('backend/resources/json/user.json', function(response) {
             actual_JSON = JSON.parse(response);
             globalId = actual_JSON.passkey;
             onValidate();
             });
}

//function to validate login
function onValidate(){
    var currentDoc = getActiveDocument();
    passkeyData = currentDoc.getElementById("passkey");
    var keyboard =passkeyData.getFeature('Keyboard');
    var passkeyId = keyboard.text;
    if(passkeyId==globalId){
        getDocument('backend/templates/home.xml');
        navigationDocument.removeDocument(currentDoc);
    }
    else{
        
        getDocument('backend/templates/loginPage.xml');
    }
}

//fetches the document whose url is passed as extension
function getDocument(extension) {
    var templateXHR = new XMLHttpRequest();
    var url = baseURL + extension;
    
    var loadingDoc = loadingTemplate(); // this function is a stand-alone page
    templateXHR.responseType = "document";
    templateXHR.open("GET", url, true);
    if(extension == "backend/templates/home.xml")
    {
        templateXHR.addEventListener("load", function() {pushPageWithEvent(templateXHR.responseXML, loadingDoc);}, false);
    }
    else if(extension == "backend/templates/productPage.xml")
    {
        templateXHR.addEventListener("load", function() {parseJsonProductPage(templateXHR.responseXML, loadingDoc);}, false);
    }
    else
    {
    templateXHR.addEventListener("load", function() {replacePage(templateXHR.responseXML, loadingDoc);}, false);
    }
    templateXHR.send();
}

//following functions handle the navigation in the app by manipulating the navigation stack
function pushPage(document) {
    navigationDocument.pushDocument(document);
}

function pushPageWithEvent(document, loadingDoc) {
    document.addEventListener("select", handleSelectEvent);
    navigationDocument.replaceDocument(document, loadingDoc);
    refresher = document;
}

function pushPageWithEvent2(document, loadingDoc) {
    document.addEventListener("select", handleSelectEvent);
    navigationDocument.replaceDocument(document,loadingDoc);
    refresher = document;
}

function replacePage(document, loadingDoc) {
    navigationDocument.replaceDocument(document,loadingDoc);
}

// handles the selected event

function handleSelectEvent(event) {
    var selectedElement = event.target;
    
    var targetURL = selectedElement.getAttribute("selectTargetURL");
    if (!targetURL) {
        return;
    }
    
    if(targetURL == "backend/templates/featured.xml")
        refreshFlag = true;
    else
        refreshFlag = false;
    
    targetURL = baseURL + targetURL;

    
    if (selectedElement.tagName == "menuItem") {
        updateMenuItem(selectedElement, targetURL);
    }
    else {
        pushPage(targetURL);
    }
}

//update the menuitem selection

function updateMenuItem(menuItem, url) {
    var request = new XMLHttpRequest();
    request.open("GET", url, false); //false=sync, true = async ( although sync is not recommended, we need to wait till we get document)
    request.send();
    
    var document = request.responseXML;
    document.addEventListener("select", handleSelectEvent);
    var menuItemDocument = menuItem.parentNode.getFeature("MenuBarDocument");
    menuItemDocument.setDocument(document, menuItem);
    if(url=="http://192.168.43.140:9001/backend/templates/featured.xml"||url=="http://192.168.43.140:9001/backend/templates/onDemand.xml")
        parseJsonFeatured();
    if(url=="http://192.168.43.140:9001/backend/templates/search.xml")
        search(getActiveDocument());
};

//function to prep the metadata of the movie fetched from the info.json

function prepJSON(infoJSON)
{
    metadata = JSON.parse(infoJSON);
}
//function to play video

function playMedia(videourl, mediaType) {
    var time = 0;                                                        //workaround
    for(var i=0; i<metadata.length; i++)
    {
        if(metadata[i].movieID == imgLink)
        {
            time = metadata[i].watchtime * currentMediaDuration;
        }
    }
    var videourl = "http://192.168.43.140:8186/vid/playback.mp4";
    var singleVideo = new MediaItem(mediaType, videourl);
    var videoList = new Playlist();
    videoList.push(singleVideo);
    var myPlayer = new Player();
    myPlayer.playlist = videoList;
    myPlayer.seekToTime(time);
    myPlayer.play();
    myPlayer.addEventListener("stateDidChange", bookmarkEvent);
}

//resumes where you left from.
//right the arrangement on the shelf of the display page is random because the id is picked from top to bottom and the JSON data is already coded with the fields with empty id
function bookmarkEvent(event) {
    var elapsed = event.elapsedTime;
    if(event.state=="playing")
    {
        currentMediaDuration = event.target.currentMediaItemDuration;
        console.log(currentMediaDuration);
    }
    if(event.state=="end")
    {
        for(var i=0; i<metadata.length; i++)
        {
            if(metadata[i].movieID == imgLink)
            {
                var modElapsed = elapsed/currentMediaDuration;
                console.log(modElapsed);
                //var rounded = Math.round( modElapsed * 10 ) / 10;
                metadata[i].watchtime = modElapsed.toString();
                if (modElapsed == 0)
                {
                    metadata[i].ID = "";
                }
                else
                metadata[i].ID = ++idFlag;                                  //dangerous but works, rework when possible
            }
        }
        if(refreshFlag == true)
            refreshHome();
    }
}
//refresh page after user activity has to be displayed on the stack
function refreshHome()
{
    var templateXHR = new XMLHttpRequest();
    var url = baseURL + "backend/templates/home.xml";
    
    templateXHR.responseType = "document";
    templateXHR.open("GET", url, true);
    templateXHR.addEventListener("load", function() {pushPageWithEvent2(templateXHR.responseXML, refresher);}, false);
    templateXHR.send();
}

//function to add to favorites
function toggleFavorite(){
    var flag;
    var currentDoc = getActiveDocument();
    favoriteButton = currentDoc.getElementById("favoriteButton");
    if (favoriteButton.getAttribute("toggle")=="true")
    {
        favoriteButton.setAttribute('src', 'resource://button-rate');
        favoriteButton.setAttribute('toggle', 'false');
        currentDoc.getElementById("likeButton").textContent = "Favorite";
        flag = false;
    } else {
        favoriteButton.setAttribute('src', 'resource://button-rated');
        favoriteButton.setAttribute('toggle', 'true');
        currentDoc.getElementById("likeButton").textContent = "Unfavorite";
        flag = true;
    }
    for(var i=0; i<metadata.length; i++)
    {
        if(metadata[i].listID == imgLink)
        {
            if(flag)
            {
               metadata[i].ID = ++listidFlag;
            }
            else
            {
                metadata[i].ID = "";
            }
            
        }
            
        if(metadata[i].ID == imgLink && metadata[i].type == "artwork")
        {
            metadata[i].favorited = flag;
        }
    }
    if(refreshFlag == true)
    refreshHome();
}


function search(document) {
    var searchField = document.getElementsByTagName("searchField").item(0);
    var keyboard = searchField.getFeature("Keyboard");
    
    keyboard.onTextChange = function() {
        var searchText = keyboard.text;
        console.log("Search text changed " + searchText);
        searchResults(document, searchText);
    }
}

function searchResults(doc, searchText) {
    
    var regExp = new RegExp(searchText, "i");
    var matchesText = function(value) {
        return regExp.test(value);
    }
    
    var movies = {
        "Spiderman Homecoming": 1,
        "Star Wars: The Last Jedi": 2,
        "Inception": 3,
        "Fight Club": 4,
        "Moonlight": 5,
        "Bright": 6,
        "John Wick": 7,
        "The Shining": 8,
        "The Amazing SpiderMan": 9,
        "Blade Runner: 2049": 10,
        "Coco": 11,
        "Iron Man": 12,
        "Logan": 13
        
        
    };
    var titles = Object.keys(movies);
    var arr = titles; //to find the index of the array to match with corresponding poster
    
    var domImplementation = doc.implementation;
    var lsParser = domImplementation.createLSParser(1, null);
    var lsInput = domImplementation.createLSInput();
    
    lsInput.stringData = `<list>
    <section>
    <header>
    <title>No Results</title>
    </header>
    </section>
    </list>`;
    
    titles = (searchText) ? titles.filter(matchesText) : titles;
    
    if (titles.length > 0) {
        lsInput.stringData = `<shelf><header><title>Results</title></header><section id="Results">`;
        for (var i = 0; i < titles.length; i++) {
            for(var j=0; j<metadata.length; j++)            //to get the onselect field
            {
                if(metadata[j].title == titles[i])
                {
                    var selector = metadata[j].onselect;
                    console.log(selector);
                }
            }
            var poster = arr.indexOf(titles[i]) + 1;
            lsInput.stringData += `<lockup onselect="${selector}"><img src="http://192.168.43.140:9001/backend/resources/images/${poster}.jpg"  width="182" height="274" /><title style="font-weight:light">${titles[i]}</title></lockup>`
        }
        lsInput.stringData += `</section></shelf>`;
    }
    
    lsParser.parseWithContext(lsInput, doc.getElementsByTagName("collectionList").item(0), 2);
}

////function to faciliate buying
//function onBuy(){
//    debugger;
//    var currentDoc = getActiveDocument();
//    var price = currentDoc.getElementById("price");
//    price.parentNode.removeChild(price);
//}


function loadJSON(file, callback, call) {
    var url = baseURL + file;
    if (call) {
        url = call;
    }
    var xobj = new XMLHttpRequest();
    xobj.responseType = "json";
    xobj.open('GET', url, true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
        if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
        }
    };
    xobj.send(null);
}

//fetches correct productpage for the selected movie
function loadProductPage(movieid,imgVar) {
    imgLink = imgVar;
//    var cur = getActiveDocument();             //necessary for bookmark functionality to work properly since pressing back from product page only takes you back instead of parsing new xml
//    console.log(cur);
    var callURL = "http://www.omdbapi.com/?apikey=b64fa22b&t="+movieid;
    loadJSON("",(function (response) {
                 produtJSON = response;
                 getDocument("backend/templates/productPage.xml");
                 }),callURL);
}

function parseJsonProductPage(xml,doc) {
    var res = JSON.parse(produtJSON);
    xml.getElementById("title").textContent=res.Title;
    xml.getElementById("tomato_rating").textContent=res.Ratings[1].Value;
    var tag = xml.getElementById("tomato_rating2").innerHTML;
    xml.getElementById("tomato_rating2").innerHTML = tag + " " + res.Ratings[1].Value;
//    xml.getElementById("tomato_rating2").textContent=res.Ratings[1].Value;
    if((res.Ratings[1].Value.slice(0, -1))>90)
    {
        xml.getElementById("tomato_badge").setAttribute('src', 'resource://tomato-certified-m');
        xml.getElementById("tomato_badge2").setAttribute('src', 'resource://tomato-certified-m');
    }
    else if((res.Ratings[1].Value.slice(0, -1))>49&&(res.Ratings[1].Value.slice(0, -1))<90)
    {
        xml.getElementById("tomato_badge").setAttribute('src', 'resource://tomato-fresh-m');
        xml.getElementById("tomato_badge2").setAttribute('src', 'resource://tomato-fresh-m');
    }
    else
    {
        xml.getElementById("tomato_badge").setAttribute('src', 'resource://tomato-splat-m');
        xml.getElementById("tomato_badge2").setAttribute('src', 'resource://tomato-splat-m');
    }
    xml.getElementById("runtime").textContent=res.Runtime;
    for(var i=0; i<metadata.length; i++)
    {
        if((metadata[i].ID == imgLink) && metadata[i].type == "artwork"){
                if (metadata[i].favorited == false)
                {
                    xml.getElementById("favoriteButton").setAttribute('src', 'resource://button-rate');
                    xml.getElementById("favoriteButton").setAttribute('toggle', 'false');
                    xml.getElementById("likeButton").textContent = "Favorite";
                } else {
                    xml.getElementById("favoriteButton").setAttribute('src', 'resource://button-rated');
                    xml.getElementById("favoriteButton").setAttribute('toggle', 'true');
                    xml.getElementById("likeButton").textContent = "Unfavorite";
                }
        }
    }
    
    xml.getElementById("runtime2").textContent=res.Runtime;
    xml.getElementById("genre").textContent=res.Genre;
    xml.getElementById("year").textContent=res.Year;
    xml.getElementById("starring").textContent=res.Actors;
    xml.getElementById("director").textContent=res.Director;
    xml.getElementById("plot").textContent=res.Plot;
    var imgURL = "http://192.168.43.140:9001/backend/resources/images/"+imgLink+".jpg"
    xml.getElementById("heroimg").setAttribute('src', imgURL);
    xml.getElementById("imdb_rating").textContent=(((res.imdbRating)/2)+" / 5");
    var star = Number((res.Ratings[0].Value.slice(0, -3))/10);
    xml.getElementById("rating_star").setAttribute('value', star);
    xml.getElementById("metacritic").textContent=res.Ratings[2].Value;
    xml.getElementById("studio").textContent=res.Production;
    var str = res.Actors;
    var crew = str.split(',');
    xml.getElementById("crew1").textContent=crew[0];
    var mg = crew[0].split(' ');
    xml.getElementById("crew1_mg").setAttribute('firstName', mg[0]);
    xml.getElementById("crew1_mg").setAttribute('lastName', mg[1]);
    xml.getElementById("crew2").textContent=crew[1];
    var mg = crew[1].split(' ');
    xml.getElementById("crew2_mg").setAttribute('firstName', mg[1]); //because of the api we are using that gives us names of actor with spaces after comma
    xml.getElementById("crew2_mg").setAttribute('lastName', mg[2]);
    xml.getElementById("crew3").textContent=crew[2];
    var mg = crew[2].split(' ');
    xml.getElementById("crew3_mg").setAttribute('firstName', mg[1]);
    xml.getElementById("crew3_mg").setAttribute('lastName', mg[2]);
    var price = xml.getElementById("price");
    replacePage(xml, doc);
}


//function to parse JSON
function parseJsonFeatured() {
    var results = metadata;

    // can't bind elements to carousel due to possible bug
    for (var i=0;i<4;i++)
    {
    var shelf = getActiveDocument().getElementsByTagName("shelf").item(i)
    var section = shelf.getElementsByTagName("section").item(0)
    
    //create an empty data item for the section
    section.dataItem = new DataItem()
    
    //create data items from objects
    let newItems = results.map((result) => {
                               let objectItem = new DataItem(result.type, result.ID);
                               objectItem.url = result.url;
                               objectItem.title = result.title;
                               objectItem.onselect = result.onselect;
                               objectItem.watchtime = result.watchtime;
                               return objectItem;
                               });
    
    //add the data items to the section's data item; 'images' relates to the binding name in the protoype where items:{images} is all of the newItems being added to the sections' data item;
    section.dataItem.setPropertyPath("images", newItems)
    }
}


function changeId(){
    var currentDoc = getActiveDocument();
    changeIds=currentDoc.getElementById("changedID");
    var keyboard=changeIds.getFeature('Keyboard');
    var id=keyboard.text;
    actual_JSON.id=id;
    getDocument('backend/templates/setting.xml');
    
}

function logout(){
    navigationDocument.clear();
    getDocument('backend/templates/profile.xml');
}


/*
 * default pages
 */

var createAlert = function(title, description) {
    var alertString = `<?xml version="1.0" encoding="UTF-8" ?>
    <document>
    <alertTemplate>
    <title>${title}</title>
    <description>${description}</description>
    <button onselect="navigationDocument.dismissModal()">
    <text>OK</text>
    </button>
    </alertTemplate>
    </document>`
    var parser = new DOMParser();
    var alertDoc = parser.parseFromString(alertString, "application/xml");
    return alertDoc
}

function loadingTemplate() {
    var loadingDoc = "<document><loadingTemplate><activityIndicator><text></text></activityIndicator></loadingTemplate></document>";
    var parser = new DOMParser();
    var loadingDoc = parser.parseFromString(loadingDoc, "application/xml");
    navigationDocument.pushDocument(loadingDoc);
    return loadingDoc
}

