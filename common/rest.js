const REST_URL = "https://httpbin.org/post"; //set to the REST service if not not Atlas

const API_KEY = undefined //set if Atlas or required by REST service
//Mongo Atlas DB Api fields, will use instead of default if set
const ATLAS_REST_URL = "https://us-east-1.aws.data.mongodb-api.com/app/data-zxclb/endpoint/data/v1/action/"; 
const ATLAS_FIT_COLLECTION = "fitdata";
const ATLAS_APP_COLLECTION = "appdata";
const ATLAS_DATABASE = "lucid-trainer";
const DATA_SOURCE = "Cluster0";

export const INSERT_ACTION = "insertOne";
export const FIND_ACTION = "find";

export const REST_RESPONSE_KEY = "restResponse";
export const DEVICE_QUERY_KEY = "deviceQuery";
export const MSG_FROM_DEVICE_KEY = "deviceResponse";

export const postMessage = (msg, action) => {

  let headers = {
      "Content-Type": "application/json",
      "Access-Control-Request-Headers": "*"
  }
  if(API_KEY) {
      headers["api-key"] = API_KEY;
  }

  let url = REST_URL
  let postMsg = msg;
  if(ATLAS_REST_URL) {

      url = ATLAS_REST_URL  + action;
      postMsg = {
          "database": ATLAS_DATABASE,
          "dataSource": DATA_SOURCE,
        }
      
      if(action == INSERT_ACTION ) {
        postMsg.collection = ATLAS_FIT_COLLECTION,
        postMsg.document = msg;
      } else {
        postMsg.collection = ATLAS_APP_COLLECTION,
        postMsg.filter = msg;
        postMsg.sort = {_id: -1};
        postMsg.limit = 1;
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



