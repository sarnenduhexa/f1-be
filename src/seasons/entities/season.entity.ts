import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Driver } from '../../drivers/entities/driver.entity';

@Entity('seasons')
export class Season {
  @PrimaryColumn()
  year: number;

  @Column()
  url: string;

  @Column({ nullable: true })
  winnerDriverId: string;

  @ManyToOne(() => Driver, { eager: true, cascade: true })
  @JoinColumn({ name: 'winnerDriverId' })
  winner: Driver;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
