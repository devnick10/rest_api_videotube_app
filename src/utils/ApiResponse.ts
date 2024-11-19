
class ApiResponse {

      constructor(
          public statusCode:number,
          public data?:object| string, 
          public message:string = "Success",
          public sucess = statusCode < 400
        ){      
         
      }

}

export {ApiResponse}

