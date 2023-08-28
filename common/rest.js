const REST_URL = "https://httpbin.org/post"; //set to the REST service if not not Atlas

const API_KEY = undefined; //set if Atlas or required by REST service
//Mongo Atlas DB Api fields, will use instead of default if set
const ATLAS_REST_URL =  undefined;
const ATLAS_COLLECTION = undefined;
const ATLAS_DATABASE = undefined;
const DATA_SOURCE = undefined;
export const postMessage = (msg) => {

    let headers = {
        "Content-Type": "application/json",
        "Access-Control-Request-Headers": "*"
    }
    if(API_KEY) {
        headers["api-key"] = API_KEY;
    }

    let url = REST_URL;
    let postMsg = msg;
    if(ATLAS_REST_URL) {
        url = ATLAS_REST_URL
        postMsg = {
            "collection": ATLAS_COLLECTION,
            "database": ATLAS_DATABASE,
            "dataSource": DATA_SOURCE,
            "document": msg
          }
    }

    return new Promise(function (resolve, reject) {
        fetch(url, {
            method: "POST",
            body: JSON.stringify(postMsg),
            headers: headers
        })
        .then(response => response.json())
        .then(json => 
          { 
            resolve(json); 
          }
        )
        .catch(error => reject(error));
    });
}

export const formatResponse = (resp) => {
  if(ATLAS_REST_URL) {
    let { insertedId, filename } = resp;
    return {
      "id:": insertedId.slice(0,8),
      "filename": filename
    }
  } else {
    let { movement, heartRate, isSleep } = JSON.parse(resp.data);
    return movement + ":" + heartRate + ":" + isSleep;
  }
}



