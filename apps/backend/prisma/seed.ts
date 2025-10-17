import { PrismaClient, UserRole, UserStatus, EventStatus, EventCategory, TicketStatus, PaymentStatus, SubscriptionPlan, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tazkartak.com' },
    update: {},
    create: {
      email: 'admin@tazkartak.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  // Create organizer user
  const organizerPassword = await bcrypt.hash('organizer123', 12);
  const organizerUser = await prisma.user.upsert({
    where: { email: 'organizer@example.com' },
    update: {},
    create: {
      email: 'organizer@example.com',
      password: organizerPassword,
      firstName: 'John',
      lastName: 'Organizer',
      role: UserRole.ORGANIZER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  // Create organizer profile
  const organizer = await prisma.organizer.upsert({
    where: { userId: organizerUser.id },
    update: {},
    create: {
      userId: organizerUser.id,
      name: 'Event Masters',
      description: 'Professional event organizing company',
      website: 'https://eventmasters.com',
      isVerified: true,
    },
  });

  // Create venue owner user
  const venueOwnerPassword = await bcrypt.hash('venue123', 12);
  const venueOwnerUser = await prisma.user.upsert({
    where: { email: 'venue@example.com' },
    update: {},
    create: {
      email: 'venue@example.com',
      password: venueOwnerPassword,
      firstName: 'Sarah',
      lastName: 'VenueOwner',
      role: UserRole.VENUE_OWNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  // Create venue owner profile
  const venueOwner = await prisma.venueOwner.upsert({
    where: { userId: venueOwnerUser.id },
    update: {},
    create: {
      userId: venueOwnerUser.id,
      businessName: 'Cairo Convention Center',
      businessType: 'Event Venue',
      taxId: '123456789',
      isVerified: true,
    },
  });

  // Create venue
  const venue = await prisma.venue.upsert({
    where: { id: 'venue-1' },
    update: {},
    create: {
      id: 'venue-1',
      name: 'Cairo Convention Center',
      description: 'Modern convention center in the heart of Cairo',
      address: '123 Tahrir Square, Cairo, Egypt',
      city: 'Cairo',
      country: 'Egypt',
      latitude: 30.0444,
      longitude: 31.2357,
      capacity: 1000,
      amenities: ['parking', 'wifi', 'accessibility', 'catering', 'audio_visual'],
      images: [
        'https://example.com/venue1.jpg',
        'https://example.com/venue2.jpg'
      ],
      contactPerson: 'Ahmed Hassan',
      contactPhone: '+201234567890',
      contactEmail: 'info@cairo-convention.com',
      isVerified: true,
      ownerId: venueOwner.id,
    },
  });

  // Create event
  const event = await prisma.event.upsert({
    where: { id: 'event-1' },
    update: {},
    create: {
      id: 'event-1',
      name: 'Tech Conference 2024',
      description: 'Annual technology conference featuring the latest innovations',
      category: EventCategory.CONFERENCE,
      startDate: new Date('2024-12-15T09:00:00Z'),
      endDate: new Date('2024-12-15T18:00:00Z'),
      capacity: 500,
      price: 150.00,
      currency: 'EGP',
      status: EventStatus.PUBLISHED,
      imageUrl: 'https://example.com/tech-conference.jpg',
      isPublic: true,
      organizerId: organizer.id,
      venueId: venue.id,
    },
  });

  // Create ticket types
  const earlyBirdTicket = await prisma.ticketType.upsert({
    where: { id: 'ticket-type-1' },
    update: {},
    create: {
      id: 'ticket-type-1',
      eventId: event.id,
      name: 'Early Bird',
      description: 'Early bird discount ticket',
      price: 120.00,
      currency: 'EGP',
      quantity: 100,
      availableQuantity: 100,
      sold: 0,
      maxPerOrder: 5,
      isActive: true,
      salesStart: new Date('2024-10-01T00:00:00Z'),
      salesEnd: new Date('2024-11-30T23:59:59Z'),
    },
  });

  const regularTicket = await prisma.ticketType.upsert({
    where: { id: 'ticket-type-2' },
    update: {},
    create: {
      id: 'ticket-type-2',
      eventId: event.id,
      name: 'Regular',
      description: 'Regular admission ticket',
      price: 150.00,
      currency: 'EGP',
      quantity: 400,
      availableQuantity: 400,
      sold: 0,
      maxPerOrder: 10,
      isActive: true,
      salesStart: new Date('2024-12-01T00:00:00Z'),
      salesEnd: new Date('2024-12-14T23:59:59Z'),
    },
  });

  // Create buyer user
  const buyerPassword = await bcrypt.hash('buyer123', 12);
  const buyer = await prisma.user.upsert({
    where: { email: 'buyer@example.com' },
    update: {},
    create: {
      email: 'buyer@example.com',
      password: buyerPassword,
      firstName: 'Ahmed',
      lastName: 'Buyer',
      role: UserRole.BUYER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    },
  });

  // Create sample tickets
  const ticket1 = await prisma.ticket.upsert({
    where: { id: 'ticket-1' },
    update: {},
    create: {
      id: 'ticket-1',
      eventId: event.id,
      buyerId: buyer.id,
      qrCode: 'QR_CODE_123456789',
      price: 120.00,
      currency: 'EGP',
      status: TicketStatus.SOLD,
      purchaseDate: new Date(),
    },
  });

  const ticket2 = await prisma.ticket.upsert({
    where: { id: 'ticket-2' },
    update: {},
    create: {
      id: 'ticket-2',
      eventId: event.id,
      buyerId: buyer.id,
      qrCode: 'QR_CODE_987654321',
      price: 120.00,
      currency: 'EGP',
      status: TicketStatus.USED,
      purchaseDate: new Date(),
      usedDate: new Date(),
    },
  });

  // Create payment
  const payment = await prisma.payment.upsert({
    where: { id: 'payment-1' },
    update: {},
    create: {
      id: 'payment-1',
      ticketId: ticket1.id,
      buyerId: buyer.id,
      amount: 120.00,
      currency: 'EGP',
      method: 'CREDIT_CARD',
      status: PaymentStatus.COMPLETED,
      transactionId: 'TXN_123456789',
      processedAt: new Date(),
    },
  });

  // Create subscription plans
  const basicPlan = await prisma.subscription.upsert({
    where: { id: 'subscription-1' },
    update: {},
    create: {
      id: 'subscription-1',
      userId: organizerUser.id,
      plan: SubscriptionPlan.BASIC,
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      price: 99.00,
      currency: 'EGP',
      autoRenew: true,
    },
  });

  // Create system settings
  const settings = [
    {
      key: 'site_name',
      value: 'Tazkartak',
      type: 'string',
      category: 'general',
      description: 'Site name',
      isPublic: true,
    },
    {
      key: 'max_events_per_organizer',
      value: '10',
      type: 'number',
      category: 'limits',
      description: 'Maximum events per organizer',
      isPublic: false,
    },
    {
      key: 'default_currency',
      value: 'EGP',
      type: 'string',
      category: 'payment',
      description: 'Default currency',
      isPublic: true,
    },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }

  console.log('✅ Database seeding completed successfully!');
  console.log('📊 Created:');
  console.log(`  - 1 Admin user (admin@tazkartak.com)`);
  console.log(`  - 1 Organizer user (organizer@example.com)`);
  console.log(`  - 1 Venue owner user (venue@example.com)`);
  console.log(`  - 1 Buyer user (buyer@example.com)`);
  console.log(`  - 1 Venue (Cairo Convention Center)`);
  console.log(`  - 1 Event (Tech Conference 2024)`);
  console.log(`  - 2 Ticket types`);
  console.log(`  - 2 Sample tickets`);
  console.log(`  - 1 Payment record`);
  console.log(`  - 1 Subscription`);
  console.log(`  - 3 System settings`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });