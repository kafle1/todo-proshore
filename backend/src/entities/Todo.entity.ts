import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsDate } from 'class-validator';
import { User } from './User.entity';

@Entity()
@Index(['isDone', 'dateTime'])
@Index(['name', 'shortDescription'], { fulltext: true })
export class Todo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  @IsNotEmpty()
  name!: string;

  @Column({ type: 'text' })
  @IsNotEmpty()
  shortDescription!: string;

  @Column({ type: 'timestamp' })
  @IsDate()
  dateTime!: Date;

  @Column({ type: 'boolean', default: false })
  isDone!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @DeleteDateColumn()
  deletedAt?: Date;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, user => user.todos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;
} 