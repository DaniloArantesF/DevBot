import { Request, Response, NextFunction } from 'express';
import { TBotApi } from 'shared/types';

function log(req: Request, res: Response) {
  const { method, url, body } = req;
  const { statusCode, statusMessage } = res;
  console.log({
    method,
    url,
    body,
    statusCode,
    statusMessage,
  });
}

// Overwrites send function to log the response
function logRequest(req: Request, res: Response, next: NextFunction) {
  const send = res.send;
  // this function is called from the original send function

  res.send = function sendOverwritten(body?: any) {
    // send data
    const data = send.call(this, body);

    // log the request
    log(req, res);
    return data;
  };

  // call next middleware/handler
  next();
}

export default logRequest;
