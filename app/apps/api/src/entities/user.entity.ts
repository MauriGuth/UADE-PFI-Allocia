import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  tokenVersion: number;

  @Column('timestamptz', { nullable: true })
  emailVerifiedAt: Date | null;

  @Column({ default: false })
  alertsEnabled: boolean;

  @Column({ default: false })
  opportunitiesEnabled: boolean;

  @Column({ default: "all" })
  opportunityScope: string;

  @Column("timestamp", { nullable: true })
  privacyAcceptedAt: Date | null;

  @Column("varchar", { nullable: true })
  privacyVersion: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
