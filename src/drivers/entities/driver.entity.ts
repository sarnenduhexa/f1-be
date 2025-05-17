import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('drivers')
export class Driver {
  @PrimaryColumn()
  driverId: string;

  @Column({ nullable: true })
  permanentNumber: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  url: string;

  @Column({ nullable: true })
  givenName: string;

  @Column({ nullable: true })
  familyName: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth: Date;

  @Column({ nullable: true })
  nationality: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 