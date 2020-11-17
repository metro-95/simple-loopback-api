import {Entity, model, property} from '@loopback/repository';

@model()
export class Employee extends Entity {
  @property({
    type: 'string',
    required: true,
  })
  employee_name: string;

  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  employee_id?: number;

  @property({
    type: 'number',
    required: true,
  })
  age: number;

  @property({
    type: 'number',
  })
  salary?: number;

  @property({
    type: 'string',
  })
  url?: string;

  constructor(data?: Partial<Employee>) {
    super(data);
  }
}

export interface EmployeeRelations {
  // describe navigational properties here
}

export type EmployeeWithRelations = Employee & EmployeeRelations;
