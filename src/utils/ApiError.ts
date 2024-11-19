class ApiError extends Error {

  public statusCode:number;
  public message: string;
  public errors:[] | undefined = []
  static statusCode: number;

  constructor(

   statusCode: number,
   message: string = "Something went Wrong.",
   errors?:[],
   stack:string = ""

  ) {

    super(message);


    this.statusCode = statusCode
    this.message = message
    this.errors = errors

    if (stack) {
    this.stack 
    }else{

       Error.captureStackTrace(this,this.constructor)

    }

  }
}

export {ApiError}