import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Season } from '../../seasons/entities/season.entity';

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

  @ManyToOne(() => Season)
  @JoinColumn({ name: 'season' })
  seasonData: Season;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 