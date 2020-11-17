import {DefaultCrudRepository} from '@loopback/repository';
import {Employee, EmployeeRelations} from '../models';
import {EmployeeDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class EmployeeRepository extends DefaultCrudRepository<
  Employee,
  typeof Employee.prototype.employee_id,
  EmployeeRelations
> {
  constructor(
    @inject('datasources.employee') dataSource: EmployeeDataSource,
  ) {
    super(Employee, dataSource);
  }
}
