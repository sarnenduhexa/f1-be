import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Season } from '../../seasons/entities/season.entity';
import { Driver } from '../../drivers/entities/driver.entity';

@Entity('races')
export class Race {
  @PrimaryColumn()
  id: string;

  @Column()
  season: number;

  @Column()
  round: number;

  @Column()
  raceName: string;

  @Column()
  circuitName: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  time: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  winnerDriverId: string;

  @Column({ nullable: true })
  winnerConstructorId: string;

  @Column({ nullable: true })
  winnerTime: string;

  @Column({ type: 'int', nullable: true })
  winnerLaps: number;

  @Column({ type: 'int', nullable: true })
  winnerGrid: number;

  @Column({ type: 'int', nullable: true })
  winnerPoints: number;

  @ManyToOne(() => Season)
  @JoinColumn({ name: 'season' })
  seasonData: Season;

  @ManyToOne(() => Driver)
  @JoinColumn({ name: 'winnerDriverId' })
  winnerDriver: Driver;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
