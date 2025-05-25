import { DataSource } from 'typeorm';
import env from './env';
import { Todo } from '../entities/Todo.entity';
import { User } from '../entities/User.entity';

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: env.host,
  port: env.port,
  username: env.username,
  password: env.password,
  database: env.database,
  entities: [Todo, User],
  synchronize: true,
  logging: false,
}); 