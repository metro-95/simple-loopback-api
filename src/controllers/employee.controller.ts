import {inject} from '@loopback/core';
import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  del,
  get,
  getModelSchemaRef,
  param,
  patch,
  post,
  put,
  Request,
  requestBody,
  Response,
  RestBindings,
} from '@loopback/rest';
import AWS from 'aws-sdk';
import multer from 'multer';
import stream from 'stream';
import {Employee} from '../models';
import {EmployeeRepository} from '../repositories';

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

export class EmployeeController {
  imgUrl: any;
  constructor(
    @repository(EmployeeRepository)
    public employeeRepository: EmployeeRepository,
  ) {}

  @post('/upload', {
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

  @post('/employees', {
    responses: {
      '200': {
        description: 'Employee model instance',
        content: {'application/json': {schema: getModelSchemaRef(Employee)}},
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Employee, {
            title: 'NewEmployee',
          }),
        },
      },
    })
    employee: Employee,
  ): Promise<Employee> {
    return this.employeeRepository.create(employee);
  }

  @get('/employees/count', {
    responses: {
      '200': {
        description: 'Employee model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(@param.where(Employee) where?: Where<Employee>): Promise<Count> {
    return this.employeeRepository.count(where);
  }

  /*** Custom Query Format */
  @get('/test', {
    responses: {
      '200': {
        description: 'test for executing query',
      },
    },
  })
  async test(): Promise<any> {
    return this.employeeRepository.dataSource.execute('SELECT * FROM EMPLOYEE');
  }

  @get('/employees', {
    responses: {
      '200': {
        description: 'Array of Employee model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Employee, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.filter(Employee) filter?: Filter<Employee>,
  ): Promise<Employee[]> {
    return this.employeeRepository.find(filter);
  }

  @patch('/employees', {
    responses: {
      '200': {
        description: 'Employee PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Employee, {partial: true}),
        },
      },
    })
    employee: Employee,
    @param.where(Employee) where?: Where<Employee>,
  ): Promise<Count> {
    return this.employeeRepository.updateAll(employee, where);
  }

  @get('/employees/{id}', {
    responses: {
      '200': {
        description: 'Employee model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Employee, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Employee, {exclude: 'where'})
    filter?: FilterExcludingWhere<Employee>,
  ): Promise<Employee> {
    return this.employeeRepository.findById(id, filter);
  }

  @patch('/employees/{id}', {
    responses: {
      '204': {
        description: 'Employee PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Employee, {partial: true}),
        },
      },
    })
    employee: Employee,
  ): Promise<void> {
    await this.employeeRepository.updateById(id, employee);
  }

  @put('/employees/{id}', {
    responses: {
      '204': {
        description: 'Employee PUT success',
      },
    },
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() employee: Employee,
  ): Promise<void> {
    await this.employeeRepository.replaceById(id, employee);
  }

  @del('/employees/{id}', {
    responses: {
      '204': {
        description: 'Employee DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.employeeRepository.deleteById(id);
  }
}
