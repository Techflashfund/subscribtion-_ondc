const axios = require("axios")
const signMessage = require("../utils/utils")

const subscribe = async(req,res)=>{
 try{
    const input = req.body
    const currentTimestamp = new Date()
    const valid_until = new Date()
    valid_until.setFullYear(currentTimestamp.getFullYear()+2)
    let entity = input.message.entity;
    let key_pair = entity.key_pair;

    const data = {
        "context": {
          "operation": {
            "ops_no": input.context.operation.ops_no
          }
        },
        "message": {
          "request_id": process.env.REQUEST_ID,
          "timestamp": currentTimestamp,
          "entity": {
            "gst": {
              "legal_entity_name": (entity.gst && entity.gst.legal_entity_name) || "ABC Incorporates",
              "business_address":  (entity.gst && entity.gst.business_address) || "Trade World, Mansarpur, Coorg, Karnataka 333333",
              "city_code": (entity.gst && entity.gst.city_code) || [
                "std:080"
              ],
              "gst_no":  (entity.gst && entity.gst.gst_no) || "07AAACN2082N4Z7"
            },
            "pan": {
              "name_as_per_pan": (entity.pan && entity.pan.name_as_per_pan) || "ABC Incorporates",
              "pan_no": (entity.pan && entity.pan.pan_no) || "ASDFP7657Q",
              "date_of_incorporation":(entity.pan && entity.pan.date_of_incorporation) || "23/06/1982"
            },
            "name_of_authorised_signatory": (entity && entity.name_of_authorised_signatory) || "Anand Sharma",
            "address_of_authorised_signatory": (entity && entity.address_of_authorised_signatory) || "405, Pinnacle House, Kandiwali, Mumbai 400001",
            "email_id": (entity && entity.email_id) || "anand.sharma@abc.com",
            "mobile_no": (entity && entity.mobile_no) || 9912332199,
            "country": (entity && entity.country) || "IND",
            "subscriber_id": entity.subscriber_id,
            "unique_key_id":entity.unique_key_id || "UK-KEY999",
            "callback_url": entity.callback_url || "/",
            "key_pair": {
              "signing_public_key": process.env.SIGNING_PUBLIC_KEY,
              "encryption_public_key":process.env.ENCRYPTION_PUBLIC_KEY,
              "valid_from": (key_pair && key_pair.valid_from) || currentTimestamp,
              "valid_until": (key_pair && key_pair.valid_until) || valid_until
            }
          },
          "network_participant": input.message.network_participant
        }
      }
     const response = await axios.post(`${process.env.ENVIRONMENT_LINK}/subscribe`,data)
    //  console.log(JSON.stringify(response))
      console.log(response)
     if(!response.data.error){
        res.status(200).send({message:"success"})
     }else{
        res.status(400).send({message:response.data})
     }
    }
    catch(error){
      console.log(error)
        res.status(500).send({message:error.message})
    }
}

module.exports = {subscribe}