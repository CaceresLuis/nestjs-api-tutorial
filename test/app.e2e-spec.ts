import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { INestApplication, ValidationPipe} from '@nestjs/common';
import { PrismaService } from '../src/prisma/prisma.service';
import * as pactum from 'pactum'
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication
  let prisma: PrismaService
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    app = moduleRef.createNestApplication()
    app.useGlobalPipes( new ValidationPipe({
      whitelist: true
    }))
    await app.init()
    await app.listen(3000)

    prisma = app.get(PrismaService)

    await prisma.cleanDb()

    pactum.request.setBaseUrl('http://localhost:3000')
  })

  afterAll(() => 
    app.close()
  )

  describe('Auth', () => {
    const dto: AuthDto = {
      email: "Correo@prueva.com",
      password: '1122'
    }

    describe('Signup', () => {
      it('should throw if email empty', () =>{
        return pactum.spec().post('/auth/signup').withBody({
          password: dto.password
        }).expectStatus(400)
      })
      it('should throw if password empty', () =>{
        return pactum.spec().post('/auth/signup').withBody({
          email: dto.email
        }).expectStatus(400)
      })
      it('should throw if no body provided', () =>{
        return pactum.spec().post('/auth/signup').expectStatus(400)
      })
      it('should signup', () => {
        return pactum.spec().post('/auth/signup').withBody(dto).expectStatus(201)
      })
    })

    describe('Signing', () => {
      it('should throw if email empty', () =>{
        return pactum.spec().post('/auth/signing').withBody({
          password: dto.password
        }).expectStatus(400)
      })
      it('should throw if password empty', () =>{
        return pactum.spec().post('/auth/signing').withBody({
          email: dto.email
        }).expectStatus(400)
      })
      it('should throw if no body provided', () =>{
        return pactum.spec().post('/auth/signing').expectStatus(400)
      })
      it('should signing', () => {
        return pactum.spec().post('/auth/signing').withBody(dto).expectStatus(200).stores('userAt', 'access_token')
      })
    })
  })

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum.spec().get('/users/me').withHeaders({ Authorization: 'Bearer $S{userAt}'}).expectStatus(200)
      })
    })

    describe('Edit user', () => {
      it('should edit user', () => {
        const dto: EditUserDto = {
          fistName: "mariac",
          email: "mari@wacaco.com"
        }
        return pactum.spec().patch('/users').withHeaders({ Authorization: 'Bearer $S{userAt}'}).withBody(dto).expectStatus(200)
      })
    })
  })
  describe('Bookmark', () => {

    describe('Get empty bookmarks', () => {
      it('Should get bookmarks', () => {
        return pactum.spec().get('/bookmarks').withHeaders({ Authorization: 'Bearer $S{userAt}'}).expectStatus(200).expectBody([])
      })
    })

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'first Bookmark',
        link: 'https://www.youtube.com/watch?v=vUcNydH1tz0'
      }
      it('should create bookmark', () => {
        return pactum.spec().post('/bookmarks').withHeaders({ Authorization: 'Bearer $S{userAt}'}).withBody(dto)
        .expectStatus(201).stores('bookmarkId', 'id')
      })
    })

    describe('Get bookmarks', () => {
      it('Should get bookmarks', () => {
        return pactum.spec().get('/bookmarks').withHeaders({ Authorization: 'Bearer $S{userAt}'}).expectStatus(200).expectJsonLength(1)
      })
    })
    
    describe('Get bookmark by id', () => {
      it('Should get bookmarks by id', () => {
        return pactum.spec().get('/bookmarks/{id}').withPathParams('id', '$S{bookmarkId}')
        .withHeaders({ Authorization: 'Bearer $S{userAt}'}).expectStatus(200).expectBodyContains('$S{bookmarkId}')
      })
    })
    describe('Edit bookmark', () => {
      const dto: EditBookmarkDto = {
        title: 'Nestjs prisma crud rest api',
        description: 'Aprende a crear un CRUD de Nestjs en conjunto con una base de datos a traves de Prisma, un ORM de Nodejs. Un ORM es un modulo que permite hacer consultas a bases de datos a traves de codigo de Javascript, por lo que podras usar codigo de Typescript en nestjs para hacer tus consultas a bases de datos como PostgreSQL, SQlite, MySQL y otras. De hecho en este tutorial estaremos usando Sqlite como base de datos SQL.'
      }
      it('Should get bookmarks by id', () => {
        return pactum.spec().patch('/bookmarks/{id}').withPathParams('id', '$S{bookmarkId}')
        .withHeaders({ Authorization: 'Bearer $S{userAt}'}).withBody(dto).expectStatus(200).expectBodyContains(dto.title).expectBodyContains(dto.description)
      })
    })

    describe('Delete bookmark', () => {
      it('Should get bookmarks by id', () => {
        return pactum.spec().delete('/bookmarks/{id}').withPathParams('id', '$S{bookmarkId}')
        .withHeaders({ Authorization: 'Bearer $S{userAt}'}).expectStatus(204)
      })
      it('should get empty bookmark', () => {
        return pactum.spec().get('/bookmarks').withHeaders({ Authorization: 'Bearer $S{userAt}'}).expectStatus(200).expectJsonLength(0)
      })
    })
  })
})
