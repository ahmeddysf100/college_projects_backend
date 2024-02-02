import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

      createUserDto.password = hashedPassword;

      const create = await this.prisma.user.create({
        data: {
          username: createUserDto.namee,
          email: createUserDto.email,
          password: createUserDto.password,
          role: createUserDto.role,
        },
      });
      if (!create) return 'no create user';
      delete create.password;
      delete create.id;
      delete create.role;
      return { create: create, HttpStatus: HttpStatus.CREATED };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          //p is capital
          throw new ForbiddenException('this info taken');
        }
      }
      throw error;
    }
  }

  async findAll() {
    try {
      const findall = await this.prisma.user.findMany();
      if (!findall) {
        throw new NotFoundException();
      }
      const usersWithoutPassword = findall.map((user) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return usersWithoutPassword;
    } catch (error) {
      return error;
    }
  }

  async findOne(id: number) {
    try {
      const findone = await this.prisma.user.findUnique({
        where: {
          id: id,
        },
      });
      if (!findone) {
        throw new NotFoundException(`${id} not fuond`);
      }
      delete findone.password;
      return findone;
    } catch (error) {
      return error;
    }
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    try {
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }
      console.log(updateUserDto);
      const update = await this.prisma.user.update({
        where: {
          id: id,
        },
        data: {
          username: updateUserDto.namee,
          email: updateUserDto.email,
          password: updateUserDto.password,
        },
      });
      if (!update) {
        throw new HttpException('user did not update', HttpStatus.NOT_MODIFIED);
      }
      delete update.password;
      return update;
    } catch (error) {
      return error;
    }
  }

  async remove(id: number) {
    try {
      const deletee = await this.prisma.user.delete({
        where: {
          id: id,
        },
      });
      if (!deletee) {
        throw new HttpException(`${id} did not delete`, HttpStatus.BAD_REQUEST);
      }
      delete deletee.password;
      return deletee;
    } catch (error) {
      return error;
    }
  }
}
