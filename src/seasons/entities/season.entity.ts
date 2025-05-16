import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('seasons')
export class Season {
  @PrimaryColumn()
  year: number;

  @Column()
  url: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 