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
    baseURL = options.BASEURL;
    getDocument('backend/templates/loginPage.xml'); //entry point of the pages
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
var emailData;
var favoriteButton;
var favoriteClass ="resource://button-rate";
var toggle;
var isTrueSet = false;
var isBuy = false;
var globalId;
var actual_JSON;


/*
 * functions - core functions that handle navigation and data request
 */


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
    if(url=="http://localhost:9001/backend/templates/search.xml")
    search(getActiveDocument());
};

// function to make AJAX call

//function makeAjaxCall(url) {
//    debugger;
//    var url = 'https://jsonplaceholder.typicode.com/posts/1';
//    var resourceXHR = new XMLHttpRequest();
//    resourceXHR.responseType = "json";
//    resourceXHR.addEventListener("load", (function () {
//                                          onSuccess(resourceXHR.response);
//                                          }));
//    resourceXHR.addEventListener("error", (function () {
//                                           onError({status: resourceXHR.status, statusText: resourceXHR.statusText});
//                                           }));
//    resourceXHR.open("GET", url , true);
//    resourceXHR.send();
//
//    function onSuccess(data){
//        debugger;
//        return data;
//    }
//
//    function onError(data){
//        console.log("error");
//    }
//}

//function to play video

function playMedia(extension, mediaType) {
    var videourl = "http://10.10.0.40/live/r17clear/index.m3u8";
    var singleVideo = new MediaItem(mediaType, videourl);
    var videoList = new Playlist();
    videoList.push(singleVideo);
    var myPlayer = new Player();
    myPlayer.playlist = videoList;
    myPlayer.play();
}

//function to add to favorites
function addToFavorite(){
    var currentDoc = getActiveDocument();
    favoriteButton = currentDoc.getElementById("favoriteButton");
    if (isTrueSet == true)
    {
        favoriteButton.setAttribute('src', 'resource://button-rate');
    } else {
        favoriteButton.setAttribute('src', 'resource://button-rated');
    }
    isTrueSet=!isTrueSet;
}

//function to validate login
function onValidate(){
    var currentDoc = getActiveDocument();
    emailData = currentDoc.getElementById("email");
    var keyboard =emailData.getFeature('Keyboard');
    var emailId = keyboard.text;
    if(emailId==globalId){
        getDocument('backend/templates/home.xml');
    }
    else{
        
        getDocument('backend/templates/loginPage.xml');
    }
}

function search(document) {
    debugger;
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
        "Surf": 1,
        "Sand": 2,
        "Fun": 3,
    };
    var titles = Object.keys(movies);
    console.log(titles);
    
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
            lsInput.stringData += `<lockup><img src="http://localhost:9001/backend/resources/images/5.jpg"  width="182" height="274" /><title>${titles[i]}</title></lockup>`
        }
        lsInput.stringData += `</section></shelf>`;
    }
    
    lsParser.parseWithContext(lsInput, doc.getElementsByTagName("collectionList").item(0), 2);
}

////function to faciliate buying
//function onBuy(){
//    debugger;
//    var currentDoc = getActiveDocument();
//    var buyButton = currentDoc.getElementById("buyButton");
////    var buyTitle = currentDoc.getElementsByTagName("title")[2];
//    if (isBuy == true)
//    {
//        buyButton.setAttribute('src', 'resource://button-add');
////        buyTitle[2].nodeValue = "Buy";
//    } else {
//        buyButton.setAttribute('src', 'resource://button-play');
////        buyTitle[2].nodeValue = "Play";
//    }
//    isBuy=!isBuy;
//}
function loadJSON(file, callback) {
    var url = baseURL + file;
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

//loading user datails statically
function loadUserDetails() {
    loadJSON('backend/resources/json/user.json', function(response) {
             actual_JSON = JSON.parse(response);
             globalId = actual_JSON.id;
             onValidate();
             
             });
}

function test() {
    getDocument("backend/templates/featured.xml");
    loadJSON("backend/resources/json/info.json",parseJson);
}

function test2() {
    var curr = getActiveDocument();
    var idget = curr.getElementById("id1");
    console.log(idget.getAttribute("itemID"));
    getDocument("backend/templates/productPage.xml");
   // loadJSON("backend/resources/json/info.json",parseJson);
}

//function to parse JSON
function parseJson(information) {
    debugger;
    var results = JSON.parse(information);
    
//    var carousel = getActiveDocument().getElementsByTagName("carousel").item(0)
//    var section1 = carousel.getElementsByTagName("section").item(0)
//
//    //create an empty data item for the section
//    section1.dataItem = new DataItem()
//
//    //create data items from objects
//    let newItems = results.map((result) => {
//                               let objectItem = new DataItem(result.type, result.ID);
//                               objectItem.url = result.url;
//                               objectItem.title = result.title;
//                               objectItem.ID = result.ID;
//                               return objectItem;
//                               });
//
//    //add the data items to the section's data item; 'images' relates to the binding name in the protoype where items:{images} is all of the newItems being added to the sections' data item;
//    section1.dataItem.setPropertyPath("posters", newItems)
//    //for the section areas
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
                               return objectItem;
                               });
    
    //add the data items to the section's data item; 'images' relates to the binding name in the protoype where items:{images} is all of the newItems being added to the sections' data item;
    section.dataItem.setPropertyPath("images", newItems)
    }
//    debugger;
//    var carousel = getActiveDocument().getElementsByTagName("carousel").item(0);
//    var section1 = carousel.getElementsByTagName("section").item(0)
//    
//    //create an empty data item for the section
//    section.dataItem = new DataItem()
//    debugger;
//    //create data items from objects
//    let newItems = results.map((result) => {
//                               let objectItem = new DataItem(result.type, result.ID);
//                               objectItem.url = result.url;
//                               objectItem.title = result.title;
//                               return objectItem;
//                               });
//    
//    //add the data items to the section's data item; 'images' relates to the binding name in the protoype where items:{images} is all of the newItems being added to the sections' data item;
//    section.dataItem.setPropertyPath("images", newItems)
}

//validat the login page
function onValidate(){
    var currentDoc = getActiveDocument();
    emailData = currentDoc.getElementById("email");
    var keyboard =emailData.getFeature('Keyboard');
    var emailId = keyboard.text;
    if(emailId==globalId){
        var loginDoc = getActiveDocument();
        getDocument('backend/templates/home.xml');
        navigationDocument.removeDocument(loginDoc);
    }
    else{
        
        getDocument('backend/templates/loginPage.xml');
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
    getDocument('backend/templates/loginPage.xml');
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

//var favorties = function(data)
//{
//    var dataJSON = JSON.parse(data);
//    console.log(dataJSON);
//    var favoriteString = `<document>
//    <stackTemplate>
//    <banner>
//    <title>Available Action Movies</title>
//    </banner>
//    <collectionList>
//    <shelf>
//    <section>
//    <lockup>
//    <img src="path to images on your server/Car_Movie_250x375_A.png" width="182" height="274" />
//    <title>Movie 1</title>
//    </lockup>
//    <lockup>
//    <img src="path to images on your server/Car_Movie_250x375_B.png" width="182" height="274" />
//    <title>Movie 2</title>
//    </lockup>
//    <lockup>
//    <img src="path to images on your server/Car_Movie_250x375_C.png" width="182" height="274" />
//    <title>Movie 3</title>
//    </lockup>
//    </section>
//    </shelf>
//    <shelf>
//    <section>
//    <lockup>
//    <img src="path to images on your servers/Space_Movie/Space_Movie_250x375_B.png" width="182" height="274"></img>
//    <title>Movie 4</title>
//    </lockup>
//    <lockup>
//    <img src="path to images on your server/Space_Movie/Space_Movie_250x375_A.png" width="182" height="274"></img>
//    <title>Movie 5</title>
//    </lockup>
//    <lockup>
//    <img src="path to images on your server/Space_Movie/Space_Movie_250x375_C.png" width="182" height="274"></img>
//    <title>Movie 6</title>
//    </lockup>
//    </section>
//    </shelf>
//    </collectionList>
//    </stackTemplate>
//    </document>`
//    var parser = new DOMParser();
//    var favoriteDoc = parser.parseFromString(favoriteString, "application/xml");
//    return favoriteDoc
//}

