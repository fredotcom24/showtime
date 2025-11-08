import { PrismaClient, ServiceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // create Weather service
  const weatherService = await prisma.service.upsert({
    where: { name: 'weather' },
    update: {},
    create: {
      name: 'weather',
      displayName: 'Weather',
      description: 'Get weather information for any city',
      type: ServiceType.PUBLIC,
      requiresAuth: false,
    },
  });

  console.log('Weather service created');

  // create widgets for Weather
  const weatherTodayWidget = await prisma.widget.upsert({
    where: {
      serviceId_name: {
        serviceId: weatherService.id,
        name: 'weather_today',
      },
    },
    update: {},
    create: {
      serviceId: weatherService.id,
      name: 'weather_today',
      displayName: 'Météo du jour',
      description: 'Affiche la météo actuelle pour une ville',
      paramSchema: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'Nom de la ville',
            default: 'Paris',
          },
          units: {
            type: 'string',
            enum: ['metric', 'imperial'],
            description: 'Unités de mesure',
            default: 'metric',
          },
        },
        required: ['city'],
      },
      refreshRate: 1800,
    },
  });

  const weatherForecastWidget = await prisma.widget.upsert({
    where: {
      serviceId_name: {
        serviceId: weatherService.id,
        name: 'weather_forecast',
      },
    },
    update: {},
    create: {
      serviceId: weatherService.id,
      name: 'weather_forecast',
      displayName: 'Prévisions semaine',
      description: 'Affiche les prévisions météo pour les 7 prochains jours',
      paramSchema: {
        type: 'object',
        properties: {
          city: {
            type: 'string',
            description: 'Nom de la ville',
            default: 'Paris',
          },
          units: {
            type: 'string',
            enum: ['metric', 'imperial'],
            description: 'Unités de mesure',
            default: 'metric',
          },
          days: {
            type: 'integer',
            description: 'Nombre de jours (1-7)',
            default: 5,
            minimum: 1,
            maximum: 7,
          },
        },
        required: ['city'],
      },
      refreshRate: 3600,
    },
  });


    // create Calendar service
  const calendarService = await prisma.service.upsert({
    where: { name: 'calendar' },
    update: {},
    create: {
      name: 'calendar',
      displayName: 'Google Calendar',
      description: 'Access user Google Calendar events',
      type: ServiceType.PERSONAL,
      requiresAuth: true,
    },
  });

  console.log('Calendar service created');

  // create widgets for Calendar
  const upcomingEventsWidget = await prisma.widget.upsert({
    where: {
      serviceId_name: {
        serviceId: calendarService.id,
        name: 'upcoming_events',
      },
    },
    update: {},
    create: {
      serviceId: calendarService.id,
      name: 'upcoming_events',
      displayName: 'Événements à venir',
      description: 'Affiche les prochains événements de l’utilisateur',
      paramSchema: { type: 'object', properties: {}, required: [] },
      refreshRate: 300,
    },
  });


  const todayEventsWidget = await prisma.widget.upsert({
  where: {
    serviceId_name: {
      serviceId: calendarService.id,
      name: 'today_events',
    },
  },
  update: {},
  create: {
    serviceId: calendarService.id,
    name: 'today_events',
    displayName: 'Événements du jour',
    description: "Affiche les événements du jour de l'utilisateur",
    paramSchema: { type: 'object', properties: {}, required: [] },
    refreshRate: 300,
  },
});

  const birthdaysWidget = await prisma.widget.upsert({
  where: {
    serviceId_name: {
      serviceId: calendarService.id,
      name: 'birthdays',
    },
  },
  update: {},
  create: {
    serviceId: calendarService.id,
    name: 'birthdays',
    displayName: 'Anniversaires',
    description: "Affiche les anniversaires des contacts de l'utilisateur",
    paramSchema: { type: 'object', properties: {}, required: [] },
    refreshRate: 86400,
  },
});

  console.log('Weather widgets created');

  const emailService = await prisma.service.upsert({
    where: { name: 'email' },
    update: {},
    create: {
      name: 'email',
      displayName: 'Gmail',
      description: 'Access your Gmail emails',
      type: ServiceType.PUBLIC,
      requiresAuth: true,
    },
  });

  console.log('Email service created');

  // create widgets for Email
  await prisma.widget.upsert({
    where: {
      serviceId_name: {
        serviceId: emailService.id,
        name: 'unread_emails',
      },
    },
    update: {},
    create: {
      serviceId: emailService.id,
      name: 'unread_emails',
      displayName: 'Emails non lus',
      description: 'Affiche le nombre et la liste des emails non lus',
      paramSchema: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'integer',
            description: "Nombre maximum d'emails à afficher",
            default: 10,
            minimum: 1,
            maximum: 50,
          },
        },
      },
      refreshRate: 300,
    },
  });

  await prisma.widget.upsert({
    where: {
      serviceId_name: {
        serviceId: emailService.id,
        name: 'important_emails',
      },
    },
    update: {},
    create: {
      serviceId: emailService.id,
      name: 'important_emails',
      displayName: 'Emails importants',
      description: 'Affiche les emails marqués comme importants',
      paramSchema: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'integer',
            description: "Nombre maximum d'emails à afficher",
            default: 10,
            minimum: 1,
            maximum: 50,
          },
        },
      },
      refreshRate: 300,
    },
  });

  await prisma.widget.upsert({
    where: {
      serviceId_name: {
        serviceId: emailService.id,
        name: 'recent_emails',
      },
    },
    update: {},
    create: {
      serviceId: emailService.id,
      name: 'recent_emails',
      displayName: 'Derniers emails reçus',
      description: 'Affiche les derniers emails reçus',
      paramSchema: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'integer',
            description: "Nombre maximum d'emails à afficher",
            default: 10,
            minimum: 1,
            maximum: 50,
          },
        },
      },
      refreshRate: 300,
    },
  });

  console.log('Email widgets created');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
