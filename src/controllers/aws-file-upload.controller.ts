import {inject} from '@loopback/core';
import {
  post,
  Request,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import AWS from 'aws-sdk';
import multer from 'multer';
import stream from 'stream';

const {Duplex} = stream;

function bufferToStream(buffer: any) {
  const duplexStream = new Duplex();
  duplexStream.push(buffer);
  duplexStream.push(null);
  return duplexStream;
}

const config = {
  region: process.env.S3_REGION,
  accessKeyId: process.env.S3_ACCESSKEYID,
  secretAccessKey: process.env.S3_SECRETACCESSKEY,
  endpoint: process.env.S3_ENDPOINT,
};
const s3 = new AWS.S3(config);
export class StorageController {
  constructor() {}

  @post('/buckets/image/upload', {
    responses: {
      200: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
        description: '',
      },
    },
  })
  async upload(
    // @param.path.string('bucketName') bucketName: string,
    @requestBody({
      description: 'multipart/form-data value.',
      required: true,
      content: {
        'multipart/form-data': {
          // Skip body parsing
          'x-parser': 'stream',
          schema: {type: 'object'},
        },
      },
    })
    request: Request,
    @inject(RestBindings.Http.RESPONSE) response: Response,
  ): Promise<object> {
    return new Promise<object>((resolve, reject) => {
      const storage = multer.memoryStorage();
      const upload = multer({storage});

      upload.any()(request, response, async (err: any) => {
        if (err) reject(err);
        else {
          let res = new Array();
          for (const file of (request as any).files) {
            const bucketName = 'metro-images';
            const params = {
              Bucket: bucketName,
              Key: file.originalname, // File name you want to save as in S3
              Body: bufferToStream(file.buffer),
            };
            try {
              const stored = await s3.upload(params).promise();
              res.push(stored);
            } catch (err) {
              reject(err);
            }
          }
          resolve(res);
        }
      });
    });
  }
}
