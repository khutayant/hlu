import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { EmployeeMaster } from '../master/employee-master.entity';
import { MeetingMaster } from '../master/meeting-master.entity';

/**
 * Employee attendance record for a meeting.
 * One row per meeting + employee.
 */
@Entity()
@Unique(['meeting', 'employee'])
export class MeetingAttendanceInfo extends BaseEntityWithUuid {
  @ManyToOne(() => MeetingMaster, { nullable: false })
  @JoinColumn()
  meeting!: MeetingMaster;

  @ManyToOne(() => EmployeeMaster, { nullable: false })
  @JoinColumn()
  employee!: EmployeeMaster;

  @Column({ type: 'varchar', length: 512, nullable: true })
  remark?: string | null;
}
