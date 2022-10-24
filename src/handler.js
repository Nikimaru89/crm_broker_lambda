// Include the AWS SDK module
const AWS = require('aws-sdk');
let dynamodb = new AWS.DynamoDB.DocumentClient();

async function checkUserExists(key,value) {
  let keys={}
  keys[key]=value

  const params = {
    TableName: "broker",
    Key: keys,
  };
  console.log(params);
  var exists = false
  try {
    let result = await dynamodb.get(params).promise();
    if (result.Item !== undefined && result.Item !== null) {
      exists = true
    }
  }
  catch(err) {
    console.log(err);
  }

  console.log(exists);
  return (exists);
}


exports.handle = async (event, context) => {
    console.log('event',event);    
    
    const expectedAnswer = event.request.privateChallengeParameters.code; 
    if (event.request.challengeAnswer === expectedAnswer) {
        console.log("correct")
        event.response.answerCorrect = true;
    } else {
        console.log("incorrect")
        event.response.answerCorrect = false;
        console.log(event);
        return event
    }        

    let username=event.userName;
    
    let phoneNumber=event.request.userAttributes.phone_number;
    let email=event.request.userAttributes.email;
    let name = event.request.userAttributes.name;

    if (phoneNumber=="" || phoneNumber==null) {
        phoneNumber="na"
    }
    if (email=="" || email==null) {
        email="na"
    }
    
    let checkUserExist=await checkUserExists("brokerId",username)

    if (checkUserExist) {
      const params = {
        TableName: "broker",
        Key: {
          "brokerId":username
        },
        UpdateExpression: "set email = :x , phone_number = :y",
        ExpressionAttributeValues: {
          ":x": email,
          ":y": phoneNumber,
          ':MAX': name
        }
      };
      await dynamodb.update(params).promise();
    }
    else {

      const params = {
        TableName: "user_data",      
        "Item": {
          "brokerId":username,
          "email": email,
          "phone_number": phoneNumber,
          "name": name
        }
      }
      console.log(params)
      let response=await dynamodb.put(params).promise();
      console.log(params)
    }
  return event    
}