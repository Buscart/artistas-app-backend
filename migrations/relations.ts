import { relations } from "drizzle-orm/relations";
import { users, collaborations, hiringRequests, artists, venues, hiringResponses, messages, events, ticketTypes, reviews, recommendations, blogPosts, seats, purchases, services, artworks, companies, categories, purchaseItems, eventAttendees, disciplines, roles, userActivities, specializations, follows, posts, notifications, postMedia, comments, profileViews, userAchievements, achievements, eventOccurrences, userDocuments, carts, gallery, blogComments, highlightPhotos, blogPostLikes, customSpecializationProposals, featuredItems, offers, profileAnalytics, roleStats, savedItems, tads, userPreferences, customTadProposals, userContracts, cartItems, userQuotations, cartCheckouts, postLikes, commentLikes, postHashtags, hashtags } from "./schema";

export const collaborationsRelations = relations(collaborations, ({one}) => ({
	user: one(users, {
		fields: [collaborations.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	collaborations: many(collaborations),
	hiringRequests: many(hiringRequests),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	messages_receiverId: many(messages, {
		relationName: "messages_receiverId_users_id"
	}),
	reviews: many(reviews),
	recommendations: many(recommendations),
	seats: many(seats),
	purchases: many(purchases),
	services: many(services),
	artworks: many(artworks),
	events: many(events),
	eventAttendees_userId: many(eventAttendees, {
		relationName: "eventAttendees_userId_users_id"
	}),
	eventAttendees_checkedInBy: many(eventAttendees, {
		relationName: "eventAttendees_checkedInBy_users_id"
	}),
	companies: many(companies),
	userActivities_userId: many(userActivities, {
		relationName: "userActivities_userId_users_id"
	}),
	userActivities_actorId: many(userActivities, {
		relationName: "userActivities_actorId_users_id"
	}),
	artists: many(artists),
	follows_followerId: many(follows, {
		relationName: "follows_followerId_users_id"
	}),
	follows_followingId: many(follows, {
		relationName: "follows_followingId_users_id"
	}),
	posts: many(posts),
	notifications: many(notifications),
	comments: many(comments),
	profileViews_profileId: many(profileViews, {
		relationName: "profileViews_profileId_users_id"
	}),
	profileViews_viewerId: many(profileViews, {
		relationName: "profileViews_viewerId_users_id"
	}),
	userAchievements: many(userAchievements),
	blogPosts: many(blogPosts),
	specializations: many(specializations),
	userDocuments_userId: many(userDocuments, {
		relationName: "userDocuments_userId_users_id"
	}),
	userDocuments_reviewedBy: many(userDocuments, {
		relationName: "userDocuments_reviewedBy_users_id"
	}),
	carts: many(carts),
	galleries: many(gallery),
	blogComments: many(blogComments),
	highlightPhotos: many(highlightPhotos),
	blogPostLikes: many(blogPostLikes),
	customSpecializationProposals_userId: many(customSpecializationProposals, {
		relationName: "customSpecializationProposals_userId_users_id"
	}),
	customSpecializationProposals_reviewedBy: many(customSpecializationProposals, {
		relationName: "customSpecializationProposals_reviewedBy_users_id"
	}),
	featuredItems: many(featuredItems),
	offers: many(offers),
	profileAnalytics: many(profileAnalytics),
	savedItems: many(savedItems),
	userPreferences: many(userPreferences),
	customTadProposals_userId: many(customTadProposals, {
		relationName: "customTadProposals_userId_users_id"
	}),
	customTadProposals_reviewedBy: many(customTadProposals, {
		relationName: "customTadProposals_reviewedBy_users_id"
	}),
	userContracts_artistId: many(userContracts, {
		relationName: "userContracts_artistId_users_id"
	}),
	userContracts_userId: many(userContracts, {
		relationName: "userContracts_userId_users_id"
	}),
	userQuotations_userId: many(userQuotations, {
		relationName: "userQuotations_userId_users_id"
	}),
	userQuotations_artistId: many(userQuotations, {
		relationName: "userQuotations_artistId_users_id"
	}),
	cartCheckouts: many(cartCheckouts),
	postLikes: many(postLikes),
	commentLikes: many(commentLikes),
}));

export const hiringRequestsRelations = relations(hiringRequests, ({one, many}) => ({
	user: one(users, {
		fields: [hiringRequests.clientId],
		references: [users.id]
	}),
	artist: one(artists, {
		fields: [hiringRequests.artistId],
		references: [artists.id]
	}),
	venue: one(venues, {
		fields: [hiringRequests.venueId],
		references: [venues.id]
	}),
	hiringResponses: many(hiringResponses),
}));

export const artistsRelations = relations(artists, ({one, many}) => ({
	hiringRequests: many(hiringRequests),
	hiringResponses: many(hiringResponses),
	reviews: many(reviews),
	recommendations: many(recommendations),
	user: one(users, {
		fields: [artists.userId],
		references: [users.id]
	}),
	category: one(categories, {
		fields: [artists.categoryId],
		references: [categories.id]
	}),
	discipline: one(disciplines, {
		fields: [artists.disciplineId],
		references: [disciplines.id]
	}),
	role: one(roles, {
		fields: [artists.roleId],
		references: [roles.id]
	}),
	specialization: one(specializations, {
		fields: [artists.specializationId],
		references: [specializations.id]
	}),
	offers: many(offers),
}));

export const venuesRelations = relations(venues, ({one, many}) => ({
	hiringRequests: many(hiringRequests),
	reviews: many(reviews),
	recommendations: many(recommendations),
	events: many(events),
	company: one(companies, {
		fields: [venues.companyId],
		references: [companies.id]
	}),
}));

export const hiringResponsesRelations = relations(hiringResponses, ({one}) => ({
	hiringRequest: one(hiringRequests, {
		fields: [hiringResponses.requestId],
		references: [hiringRequests.id]
	}),
	artist: one(artists, {
		fields: [hiringResponses.artistId],
		references: [artists.id]
	}),
}));

export const messagesRelations = relations(messages, ({one}) => ({
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
	user_receiverId: one(users, {
		fields: [messages.receiverId],
		references: [users.id],
		relationName: "messages_receiverId_users_id"
	}),
}));

export const ticketTypesRelations = relations(ticketTypes, ({one, many}) => ({
	event: one(events, {
		fields: [ticketTypes.eventId],
		references: [events.id]
	}),
	seats: many(seats),
	purchaseItems: many(purchaseItems),
	eventAttendees: many(eventAttendees),
}));

export const eventsRelations = relations(events, ({one, many}) => ({
	ticketTypes: many(ticketTypes),
	reviews: many(reviews),
	recommendations: many(recommendations),
	seats: many(seats),
	purchases: many(purchases),
	user: one(users, {
		fields: [events.organizerId],
		references: [users.id]
	}),
	company: one(companies, {
		fields: [events.companyId],
		references: [companies.id]
	}),
	venue: one(venues, {
		fields: [events.venueId],
		references: [venues.id]
	}),
	category: one(categories, {
		fields: [events.categoryId],
		references: [categories.id]
	}),
	eventAttendees: many(eventAttendees),
	eventOccurrences: many(eventOccurrences),
}));

export const reviewsRelations = relations(reviews, ({one}) => ({
	user: one(users, {
		fields: [reviews.userId],
		references: [users.id]
	}),
	artist: one(artists, {
		fields: [reviews.artistId],
		references: [artists.id]
	}),
	event: one(events, {
		fields: [reviews.eventId],
		references: [events.id]
	}),
	venue: one(venues, {
		fields: [reviews.venueId],
		references: [venues.id]
	}),
}));

export const recommendationsRelations = relations(recommendations, ({one}) => ({
	user: one(users, {
		fields: [recommendations.userId],
		references: [users.id]
	}),
	blogPost: one(blogPosts, {
		fields: [recommendations.postId],
		references: [blogPosts.id]
	}),
	artist: one(artists, {
		fields: [recommendations.artistId],
		references: [artists.id]
	}),
	event: one(events, {
		fields: [recommendations.eventId],
		references: [events.id]
	}),
	venue: one(venues, {
		fields: [recommendations.venueId],
		references: [venues.id]
	}),
}));

export const blogPostsRelations = relations(blogPosts, ({one, many}) => ({
	recommendations: many(recommendations),
	user: one(users, {
		fields: [blogPosts.authorId],
		references: [users.id]
	}),
	blogComments: many(blogComments),
	blogPostLikes: many(blogPostLikes),
	savedItems: many(savedItems),
}));

export const seatsRelations = relations(seats, ({one, many}) => ({
	event: one(events, {
		fields: [seats.eventId],
		references: [events.id]
	}),
	ticketType: one(ticketTypes, {
		fields: [seats.ticketTypeId],
		references: [ticketTypes.id]
	}),
	user: one(users, {
		fields: [seats.reservedBy],
		references: [users.id]
	}),
	purchaseItems: many(purchaseItems),
	eventAttendees: many(eventAttendees),
}));

export const purchasesRelations = relations(purchases, ({one, many}) => ({
	event: one(events, {
		fields: [purchases.eventId],
		references: [events.id]
	}),
	user: one(users, {
		fields: [purchases.userId],
		references: [users.id]
	}),
	purchaseItems: many(purchaseItems),
	eventAttendees: many(eventAttendees),
}));

export const servicesRelations = relations(services, ({one}) => ({
	user: one(users, {
		fields: [services.userId],
		references: [users.id]
	}),
}));

export const artworksRelations = relations(artworks, ({one}) => ({
	user: one(users, {
		fields: [artworks.userId],
		references: [users.id]
	}),
}));

export const companiesRelations = relations(companies, ({one, many}) => ({
	events: many(events),
	user: one(users, {
		fields: [companies.userId],
		references: [users.id]
	}),
	venues: many(venues),
}));

export const categoriesRelations = relations(categories, ({many}) => ({
	events: many(events),
	disciplines: many(disciplines),
	roles: many(roles),
	artists: many(artists),
	specializations: many(specializations),
}));

export const purchaseItemsRelations = relations(purchaseItems, ({one}) => ({
	purchase: one(purchases, {
		fields: [purchaseItems.purchaseId],
		references: [purchases.id]
	}),
	ticketType: one(ticketTypes, {
		fields: [purchaseItems.ticketTypeId],
		references: [ticketTypes.id]
	}),
	seat: one(seats, {
		fields: [purchaseItems.seatId],
		references: [seats.id]
	}),
}));

export const eventAttendeesRelations = relations(eventAttendees, ({one}) => ({
	event: one(events, {
		fields: [eventAttendees.eventId],
		references: [events.id]
	}),
	user_userId: one(users, {
		fields: [eventAttendees.userId],
		references: [users.id],
		relationName: "eventAttendees_userId_users_id"
	}),
	purchase: one(purchases, {
		fields: [eventAttendees.purchaseId],
		references: [purchases.id]
	}),
	ticketType: one(ticketTypes, {
		fields: [eventAttendees.ticketTypeId],
		references: [ticketTypes.id]
	}),
	seat: one(seats, {
		fields: [eventAttendees.seatId],
		references: [seats.id]
	}),
	user_checkedInBy: one(users, {
		fields: [eventAttendees.checkedInBy],
		references: [users.id],
		relationName: "eventAttendees_checkedInBy_users_id"
	}),
}));

export const disciplinesRelations = relations(disciplines, ({one, many}) => ({
	category: one(categories, {
		fields: [disciplines.categoryId],
		references: [categories.id]
	}),
	roles: many(roles),
	artists: many(artists),
	specializations: many(specializations),
	tads: many(tads),
}));

export const rolesRelations = relations(roles, ({one, many}) => ({
	discipline: one(disciplines, {
		fields: [roles.disciplineId],
		references: [disciplines.id]
	}),
	category: one(categories, {
		fields: [roles.categoryId],
		references: [categories.id]
	}),
	artists: many(artists),
	specializations: many(specializations),
	customSpecializationProposals: many(customSpecializationProposals),
	roleStats: many(roleStats),
	tads: many(tads),
	customTadProposals: many(customTadProposals),
}));

export const userActivitiesRelations = relations(userActivities, ({one}) => ({
	user_userId: one(users, {
		fields: [userActivities.userId],
		references: [users.id],
		relationName: "userActivities_userId_users_id"
	}),
	user_actorId: one(users, {
		fields: [userActivities.actorId],
		references: [users.id],
		relationName: "userActivities_actorId_users_id"
	}),
}));

export const specializationsRelations = relations(specializations, ({one, many}) => ({
	artists: many(artists),
	role: one(roles, {
		fields: [specializations.roleId],
		references: [roles.id]
	}),
	discipline: one(disciplines, {
		fields: [specializations.disciplineId],
		references: [disciplines.id]
	}),
	category: one(categories, {
		fields: [specializations.categoryId],
		references: [categories.id]
	}),
	user: one(users, {
		fields: [specializations.proposedBy],
		references: [users.id]
	}),
}));

export const followsRelations = relations(follows, ({one}) => ({
	user_followerId: one(users, {
		fields: [follows.followerId],
		references: [users.id],
		relationName: "follows_followerId_users_id"
	}),
	user_followingId: one(users, {
		fields: [follows.followingId],
		references: [users.id],
		relationName: "follows_followingId_users_id"
	}),
}));

export const postsRelations = relations(posts, ({one, many}) => ({
	user: one(users, {
		fields: [posts.authorId],
		references: [users.id]
	}),
	postMedias: many(postMedia),
	comments: many(comments),
	postLikes: many(postLikes),
	postHashtags: many(postHashtags),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
}));

export const postMediaRelations = relations(postMedia, ({one}) => ({
	post: one(posts, {
		fields: [postMedia.postId],
		references: [posts.id]
	}),
}));

export const commentsRelations = relations(comments, ({one, many}) => ({
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [comments.userId],
		references: [users.id]
	}),
	comment: one(comments, {
		fields: [comments.parentId],
		references: [comments.id],
		relationName: "comments_parentId_comments_id"
	}),
	comments: many(comments, {
		relationName: "comments_parentId_comments_id"
	}),
	commentLikes: many(commentLikes),
}));

export const profileViewsRelations = relations(profileViews, ({one}) => ({
	user_profileId: one(users, {
		fields: [profileViews.profileId],
		references: [users.id],
		relationName: "profileViews_profileId_users_id"
	}),
	user_viewerId: one(users, {
		fields: [profileViews.viewerId],
		references: [users.id],
		relationName: "profileViews_viewerId_users_id"
	}),
}));

export const userAchievementsRelations = relations(userAchievements, ({one}) => ({
	user: one(users, {
		fields: [userAchievements.userId],
		references: [users.id]
	}),
	achievement: one(achievements, {
		fields: [userAchievements.achievementId],
		references: [achievements.id]
	}),
}));

export const achievementsRelations = relations(achievements, ({many}) => ({
	userAchievements: many(userAchievements),
}));

export const eventOccurrencesRelations = relations(eventOccurrences, ({one}) => ({
	event: one(events, {
		fields: [eventOccurrences.eventId],
		references: [events.id]
	}),
}));

export const userDocumentsRelations = relations(userDocuments, ({one}) => ({
	user_userId: one(users, {
		fields: [userDocuments.userId],
		references: [users.id],
		relationName: "userDocuments_userId_users_id"
	}),
	user_reviewedBy: one(users, {
		fields: [userDocuments.reviewedBy],
		references: [users.id],
		relationName: "userDocuments_reviewedBy_users_id"
	}),
}));

export const cartsRelations = relations(carts, ({one, many}) => ({
	user: one(users, {
		fields: [carts.userId],
		references: [users.id]
	}),
	cartItems: many(cartItems),
	cartCheckouts: many(cartCheckouts),
}));

export const galleryRelations = relations(gallery, ({one}) => ({
	user: one(users, {
		fields: [gallery.userId],
		references: [users.id]
	}),
}));

export const blogCommentsRelations = relations(blogComments, ({one, many}) => ({
	blogPost: one(blogPosts, {
		fields: [blogComments.postId],
		references: [blogPosts.id]
	}),
	user: one(users, {
		fields: [blogComments.authorId],
		references: [users.id]
	}),
	blogComment: one(blogComments, {
		fields: [blogComments.parentId],
		references: [blogComments.id],
		relationName: "blogComments_parentId_blogComments_id"
	}),
	blogComments: many(blogComments, {
		relationName: "blogComments_parentId_blogComments_id"
	}),
}));

export const highlightPhotosRelations = relations(highlightPhotos, ({one}) => ({
	user: one(users, {
		fields: [highlightPhotos.userId],
		references: [users.id]
	}),
}));

export const blogPostLikesRelations = relations(blogPostLikes, ({one}) => ({
	blogPost: one(blogPosts, {
		fields: [blogPostLikes.postId],
		references: [blogPosts.id]
	}),
	user: one(users, {
		fields: [blogPostLikes.userId],
		references: [users.id]
	}),
}));

export const customSpecializationProposalsRelations = relations(customSpecializationProposals, ({one}) => ({
	user_userId: one(users, {
		fields: [customSpecializationProposals.userId],
		references: [users.id],
		relationName: "customSpecializationProposals_userId_users_id"
	}),
	role: one(roles, {
		fields: [customSpecializationProposals.roleId],
		references: [roles.id]
	}),
	user_reviewedBy: one(users, {
		fields: [customSpecializationProposals.reviewedBy],
		references: [users.id],
		relationName: "customSpecializationProposals_reviewedBy_users_id"
	}),
}));

export const featuredItemsRelations = relations(featuredItems, ({one}) => ({
	user: one(users, {
		fields: [featuredItems.userId],
		references: [users.id]
	}),
}));

export const offersRelations = relations(offers, ({one}) => ({
	user: one(users, {
		fields: [offers.clientId],
		references: [users.id]
	}),
	artist: one(artists, {
		fields: [offers.artistId],
		references: [artists.id]
	}),
}));

export const profileAnalyticsRelations = relations(profileAnalytics, ({one}) => ({
	user: one(users, {
		fields: [profileAnalytics.userId],
		references: [users.id]
	}),
}));

export const roleStatsRelations = relations(roleStats, ({one}) => ({
	role: one(roles, {
		fields: [roleStats.roleId],
		references: [roles.id]
	}),
}));

export const savedItemsRelations = relations(savedItems, ({one}) => ({
	user: one(users, {
		fields: [savedItems.userId],
		references: [users.id]
	}),
	blogPost: one(blogPosts, {
		fields: [savedItems.postId],
		references: [blogPosts.id]
	}),
}));

export const tadsRelations = relations(tads, ({one}) => ({
	role: one(roles, {
		fields: [tads.roleId],
		references: [roles.id]
	}),
	discipline: one(disciplines, {
		fields: [tads.suggestedDisciplineId],
		references: [disciplines.id]
	}),
}));

export const userPreferencesRelations = relations(userPreferences, ({one}) => ({
	user: one(users, {
		fields: [userPreferences.userId],
		references: [users.id]
	}),
}));

export const customTadProposalsRelations = relations(customTadProposals, ({one}) => ({
	user_userId: one(users, {
		fields: [customTadProposals.userId],
		references: [users.id],
		relationName: "customTadProposals_userId_users_id"
	}),
	role: one(roles, {
		fields: [customTadProposals.roleId],
		references: [roles.id]
	}),
	user_reviewedBy: one(users, {
		fields: [customTadProposals.reviewedBy],
		references: [users.id],
		relationName: "customTadProposals_reviewedBy_users_id"
	}),
}));

export const userContractsRelations = relations(userContracts, ({one}) => ({
	user_artistId: one(users, {
		fields: [userContracts.artistId],
		references: [users.id],
		relationName: "userContracts_artistId_users_id"
	}),
	user_userId: one(users, {
		fields: [userContracts.userId],
		references: [users.id],
		relationName: "userContracts_userId_users_id"
	}),
}));

export const cartItemsRelations = relations(cartItems, ({one}) => ({
	cart: one(carts, {
		fields: [cartItems.cartId],
		references: [carts.id]
	}),
}));

export const userQuotationsRelations = relations(userQuotations, ({one}) => ({
	user_userId: one(users, {
		fields: [userQuotations.userId],
		references: [users.id],
		relationName: "userQuotations_userId_users_id"
	}),
	user_artistId: one(users, {
		fields: [userQuotations.artistId],
		references: [users.id],
		relationName: "userQuotations_artistId_users_id"
	}),
}));

export const cartCheckoutsRelations = relations(cartCheckouts, ({one}) => ({
	cart: one(carts, {
		fields: [cartCheckouts.cartId],
		references: [carts.id]
	}),
	user: one(users, {
		fields: [cartCheckouts.userId],
		references: [users.id]
	}),
}));

export const postLikesRelations = relations(postLikes, ({one}) => ({
	post: one(posts, {
		fields: [postLikes.postId],
		references: [posts.id]
	}),
	user: one(users, {
		fields: [postLikes.userId],
		references: [users.id]
	}),
}));

export const commentLikesRelations = relations(commentLikes, ({one}) => ({
	comment: one(comments, {
		fields: [commentLikes.commentId],
		references: [comments.id]
	}),
	user: one(users, {
		fields: [commentLikes.userId],
		references: [users.id]
	}),
}));

export const postHashtagsRelations = relations(postHashtags, ({one}) => ({
	post: one(posts, {
		fields: [postHashtags.postId],
		references: [posts.id]
	}),
	hashtag: one(hashtags, {
		fields: [postHashtags.hashtagId],
		references: [hashtags.id]
	}),
}));

export const hashtagsRelations = relations(hashtags, ({many}) => ({
	postHashtags: many(postHashtags),
}));