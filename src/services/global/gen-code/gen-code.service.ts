import { CodeGenInfo } from '../../../../libs/entity/src/index.js';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import dayjs from 'dayjs';
import { DataSource, type Repository } from 'typeorm';
import {
  type CodeDelimiter,
  type CodeStructure,
} from '../../../resources/data/code-structure/code-structure.data.js';

@Injectable()
export class GenCodeService {
  private readonly logger = new Logger(GenCodeService.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(CodeGenInfo)
    private readonly codeGenRepository: Repository<CodeGenInfo>,
  ) {}

  private getCode(data: {
    prefix?: string | null;
    year: number;
    month: number;
    day: number;
    number: number;
    numberPadding: number;
    delimiter: CodeDelimiter;
  }): string {
    const number = data.number.toString().padStart(data.numberPadding, '0');
    const codeParts: string[] = [];

    if (data.prefix) {
      codeParts.push(data.prefix);
    }

    if (data.year > 0) {
      codeParts.push(data.year.toString().padStart(4, '0'));
    }

    if (data.month > 0) {
      codeParts.push(data.month.toString().padStart(2, '0'));
    }

    if (data.day > 0) {
      codeParts.push(data.day.toString().padStart(2, '0'));
    }

    codeParts.push(number);

    if (data.delimiter) {
      return codeParts.join(data.delimiter);
    }
    return codeParts.join('');
  }

  private async getNextNumbers(options: {
    reqId?: string;
    type: string;
    numberPadding: number;
    useYear: boolean;
    useMonth: boolean;
    useDay: boolean;
    delimiter: CodeDelimiter;
    prefix?: string | null;
    count: number;
  }): Promise<string[]> {
    if (!Number.isInteger(options.count) || options.count < 1) {
      throw new BadRequestException(
        `Code generation count must be an integer >= 1${options.reqId ? ` [ReqID: ${options.reqId}]` : ''}`,
      );
    }

    const useYear = options.useYear === true;
    const useMonth = options.useMonth === true;
    const useDay = options.useDay === true;

    const now = dayjs();
    const year = useYear ? now.year() : 0;
    const month = useMonth ? now.month() + 1 : 0;
    const day = useDay ? now.date() : 0;
    const type = options.type;

    this.logger.debug(
      [
        'GET_NEXT_NUMBER:',
        options.reqId ? `[ReqID=${options.reqId}]` : null,
        `[Type=${type}]`,
        `[Year=${year}]`,
        `[Month=${month}]`,
        `[Day=${day}]`,
        `[Count=${options.count}]`,
        'Getting next number...',
      ]
        .filter(Boolean)
        .join(' '),
    );

    return this.dataSource.transaction(async (manager) => {
      let seed = await manager.findOne(CodeGenInfo, {
        where: {
          type,
          year,
          month,
          day,
        },
        lock: { mode: 'pessimistic_write' },
      });

      let firstNumber: number;
      if (seed) {
        firstNumber = seed.number + 1;
        seed.number += options.count;
        await manager.save(seed);
      } else {
        firstNumber = 1;
        seed = this.codeGenRepository.create({
          type,
          year,
          month,
          day,
          number: options.count,
          prefix: options.prefix ?? null,
        });
        await manager.save(seed);
      }

      const prefix = options.prefix ?? seed.prefix ?? null;
      const codes: string[] = [];
      for (let index = 0; index < options.count; index += 1) {
        codes.push(
          this.getCode({
            prefix,
            year: seed.year,
            month: seed.month,
            day: seed.day,
            number: firstNumber + index,
            numberPadding: options.numberPadding,
            delimiter: options.delimiter,
          }),
        );
      }

      this.logger.debug(
        [
          'GET_NEXT_NUMBER:',
          options.reqId ? `[ReqID=${options.reqId}]` : null,
          `[Type=${type}]`,
          `[Count=${options.count}]`,
          `Generated codes: ${codes[0]}${codes.length > 1 ? `..${codes[codes.length - 1]}` : ''}`,
        ]
          .filter(Boolean)
          .join(' '),
      );

      return codes;
    });
  }

  /**
   * Reserves `count` consecutive codes in one lock/update.
   * Sequence key: type + year + month + day.
   */
  async getInfoCodes(data: {
    structure: CodeStructure;
    count: number;
    reqId?: string;
  }): Promise<string[]> {
    if (data.count === 0) {
      return [];
    }

    if (!data.structure?.type) {
      throw new BadRequestException(
        `Code structure type is required${data.reqId ? ` [ReqID: ${data.reqId}]` : ''}`,
      );
    }

    return this.getNextNumbers({
      reqId: data.reqId,
      type: data.structure.type,
      numberPadding: data.structure.padding,
      useYear: data.structure.year,
      useMonth: data.structure.month,
      useDay: data.structure.day,
      delimiter: data.structure.delimiter,
      prefix: data.structure.prefix,
      count: data.count,
    });
  }

  /**
   * Generates the next code from a CODE_STRUCTURE entry.
   */
  async getInfoCode(data: {
    structure: CodeStructure;
    reqId?: string;
  }): Promise<string> {
    const [code] = await this.getInfoCodes({ ...data, count: 1 });
    return code;
  }
}
