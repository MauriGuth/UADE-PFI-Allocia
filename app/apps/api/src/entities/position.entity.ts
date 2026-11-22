import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { encryptQuantity, decryptQuantity } from "../security/crypto";
import { User } from "./user.entity";
import { Instrument } from "./instrument.entity";

@Entity("positions")
export class Position {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Instrument, { eager: true })
  @JoinColumn({ name: "ticker" })
  instrument: Instrument;

  @Column()
  ticker: string;

  @Column("text", { transformer: { to: encryptQuantity, from: decryptQuantity } })
  quantity: string;

  @CreateDateColumn()
  createdAt: Date;
}
