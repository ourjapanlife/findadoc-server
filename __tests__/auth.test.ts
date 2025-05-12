import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authorize, buildUserContext, Role, Scope } from '../src/auth'
import { envVariables } from '../utils/environmentVariables'
import { FastifyRequest } from 'fastify'

// Mock envVariables to control testing environment
beforeEach(() => {
    vi.restoreAllMocks()
})

describe('authorize()', () => {
    it('should skip auth checks in testing environment', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(true)
        const result = authorize({ sub: 'test1', name: 'Test', email: 'findadoctest@test.com', roles: [], scope: '' }, [Scope['read:facilities']])

        expect(result).toBe(true)
    })

    it('should allow Admin to access all admin scopes', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
        const adminUser = {
            sub: 'adminTest',
            name: 'Findadoc Admin',
            email: 'findadocAdmin@admin.com',
            roles: [Role.Admin],
            scope: ''
        }

        // Admins should have access to all scopes
        expect(authorize(adminUser, [Scope['read:healthcareprofessionals']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:healthcareprofessionals']])).toBe(true)
        expect(authorize(adminUser, [Scope['delete:healthcareprofessionals']])).toBe(true)
        expect(authorize(adminUser, [Scope['read:facilities']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:facilities']])).toBe(true)
        expect(authorize(adminUser, [Scope['delete:facilities']])).toBe(true)
        expect(authorize(adminUser, [Scope['read:submissions']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:submissions']])).toBe(true)
        expect(authorize(adminUser, [Scope['delete:submissions']])).toBe(true)
        expect(authorize(adminUser, [Scope['read:users']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:users']])).toBe(true)
        expect(authorize(adminUser, [Scope['delete:users']])).toBe(true)
        expect(authorize(adminUser, [Scope['read:profile']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:posts']])).toBe(true)
        expect(authorize(adminUser, [Scope['read:logs']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:logs']])).toBe(true)
    })

    it('should allow Moderator to access moderator scopes', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
        const adminUser = {
            sub: 'moderatorTest',
            name: 'Findadoc moderator',
            email: 'findadocModerator@moderator.com',
            roles: [Role.Moderator],
            scope: ''
        }

        // Moderators should have access to moderator and user scopes
        expect(authorize(adminUser, [Scope['read:healthcareprofessionals']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:healthcareprofessionals']])).toBe(true)
        expect(authorize(adminUser, [Scope['delete:healthcareprofessionals']])).toBe(true)
        expect(authorize(adminUser, [Scope['read:facilities']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:facilities']])).toBe(true)
        expect(authorize(adminUser, [Scope['delete:facilities']])).toBe(true)
        expect(authorize(adminUser, [Scope['read:submissions']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:submissions']])).toBe(true)
        expect(authorize(adminUser, [Scope['delete:submissions']])).toBe(true)
        expect(authorize(adminUser, [Scope['read:profile']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:posts']])).toBe(true)
    })

    it('should not allow Moderator to access admin scopes', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
        const adminUser = {
            sub: 'moderatorTest',
            name: 'Findadoc moderator',
            email: 'findadocModerator@moderator.com',
            roles: [Role.Moderator],
            scope: ''
        }

        expect(authorize(adminUser, [Scope['read:users']])).toBe(false)
        expect(authorize(adminUser, [Scope['write:users']])).toBe(false)
        expect(authorize(adminUser, [Scope['delete:users']])).toBe(false)
        expect(authorize(adminUser, [Scope['read:logs']])).toBe(false)
        expect(authorize(adminUser, [Scope['write:logs']])).toBe(false)
    })

    it('should allow User to access user scopes', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
        const adminUser = {
            sub: 'userTest',
            name: 'Findadoc user',
            email: 'findadocUser@auser.com',
            roles: [Role.User],
            scope: ''
        }

        // users should have access to user scopes
        expect(authorize(adminUser, [Scope['read:healthcareprofessionals']])).toBe(true)
        expect(authorize(adminUser, [Scope['read:facilities']])).toBe(true)
        expect(authorize(adminUser, [Scope['write:submissions']])).toBe(true)
        expect(authorize(adminUser, [Scope['read:profile']])).toBe(true)
    })

    it('should not allow User to access moderator or admin scopes', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
        const adminUser = {
            sub: 'userTest',
            name: 'Findadoc user',
            email: 'findadocUser@auser.com',
            roles: [Role.User],
            scope: ''
        }

        // users should not have access to moderator or admin scopes
        expect(authorize(adminUser, [Scope['write:healthcareprofessionals']])).toBe(false)
        expect(authorize(adminUser, [Scope['delete:healthcareprofessionals']])).toBe(false)
        expect(authorize(adminUser, [Scope['write:facilities']])).toBe(false)
        expect(authorize(adminUser, [Scope['delete:facilities']])).toBe(false)
        expect(authorize(adminUser, [Scope['read:submissions']])).toBe(false)
        expect(authorize(adminUser, [Scope['delete:submissions']])).toBe(false)
        expect(authorize(adminUser, [Scope['read:users']])).toBe(false)
        expect(authorize(adminUser, [Scope['write:users']])).toBe(false)
        expect(authorize(adminUser, [Scope['delete:users']])).toBe(false)
        expect(authorize(adminUser, [Scope['write:posts']])).toBe(false)
        expect(authorize(adminUser, [Scope['read:logs']])).toBe(false)
        expect(authorize(adminUser, [Scope['write:logs']])).toBe(false)
    })

    it('should allow a User from to read facilities', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
        const normalUser = {
            sub: 'findadocNormalUser',
            name: 'User',
            email: 'findadocUser@user.com',
            roles: [Role.User],
            scope: ''
        }

        expect(authorize(normalUser, [Scope['read:facilities']])).toBe(true)
    })

    it('should deny User from deleting facilities', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
        const normalUser = {
            sub: 'findadocNormalUser',
            name: 'User',
            email: 'findadocUser@user.com',
            roles: [Role.User],
            scope: ''
        }

        expect(authorize(normalUser, [Scope['delete:facilities']])).toBe(false)
    })

    it('should allow a Moderator to delete facilities', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
        const modUser = {
            sub: 'findadocMod',
            name: 'findadocModName',
            email: 'findadocMod@findadocMod.com',
            roles: [Role.Moderator],
            scope: ''
        }

        expect(authorize(modUser, [Scope['delete:facilities']])).toBe(true)
    })

    it('should deny Moderator from reading logs', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
        const modUser = {
            sub: 'findadocMod',
            name: 'findadocModName',
            email: 'findadocMod@findadocMod.com',
            roles: [Role.Moderator],
            scope: ''
        }

        expect(authorize(modUser, [Scope['read:logs']])).toBe(false)
    })

    it('should combine explicit scopes and role-derived scopes', () => {
        vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
        const modUser = {
            sub: 'findadocMod',
            name: 'findadocModName',
            email: 'findadocMod@findadocMod.com',
            roles: [Role.Moderator],
            scope: Scope['read:logs'] // explicit scope not in Moderator role if we give access to that
        }

        // Moderator role doesn't include read:logs, but explicit scope should allow it
        expect(authorize(modUser, [Scope['read:logs']])).toBe(true)
    })

    it('should allow Admin to delete facilities', () => {
        const findadocAdmin = {
            sub: 'findadocAdmin',
            name: 'Admin',
            email: 'findadocAdmin@findadoc.com',
            roles: [Role.Admin],
            scope: ''
        }

        expect(authorize(findadocAdmin, [Scope['delete:facilities']])).toBe(true)
    })
})

describe('roleScopes invariant: no accidental changes', () => {
    const expectedRoleScopes: Record<Role, Scope[]> = {
        [Role.Admin]: [
            Scope['read:healthcareprofessionals'], Scope['write:healthcareprofessionals'], Scope['delete:healthcareprofessionals'],
            Scope['read:facilities'], Scope['write:facilities'], Scope['delete:facilities'],
            Scope['read:submissions'], Scope['write:submissions'], Scope['delete:submissions'],
            Scope['read:users'], Scope['write:users'], Scope['delete:users'],
            Scope['read:profile'],
            Scope['write:posts'],
            Scope['read:logs'], Scope['write:logs']
        ],
        [Role.Moderator]: [
            Scope['read:healthcareprofessionals'], Scope['write:healthcareprofessionals'], Scope['delete:healthcareprofessionals'],
            Scope['read:facilities'], Scope['write:facilities'], Scope['delete:facilities'],
            Scope['read:submissions'], Scope['write:submissions'], Scope['delete:submissions'],
            Scope['read:profile'],
            Scope['write:posts']
        ],
        [Role.User]: [
            Scope['read:healthcareprofessionals'],
            Scope['read:facilities'],
            Scope['write:submissions'],
            Scope['read:profile']
        ]
    }

    const allScopes = Object.values(Scope)

    for (const role of Object.values(Role)) {
        it(`${role} should have exactly the expected scopes`, () => {
            vi.spyOn(envVariables, 'isTestingEnvironment').mockReturnValue(false)
            const user = { sub: 'unintendedScopeChange',
                name: 'unintendedScopeChangePerson',
                email: 'unintendedScopeChange@unintendedScopeChange.com',
                roles: [role],
                scope: '' }
            // Check each expected scope is allowed

            expectedRoleScopes[role].forEach(scope => {
                expect(authorize(user, [scope])).toBe(true)
            })
            // Check no unexpected scopes slip in
            allScopes.filter(s => !expectedRoleScopes[role].includes(s)).forEach(scope => {
                expect(authorize(user, [scope])).toBe(false)
            })
        })
    }
})

describe('buildUserContext()', () => {
    it('should map Auth0 roles claim and standard roles', async () => {
        const fakeReq = { user: { sub: 'findadocSubTest', name: 'FindaDocName', email: 'findadocSubTest@FindadocSubTest.com', scope: 'read:profile write:posts', 'https://findadoc.jp/roles': [Role.User] } } as FastifyRequest
        const ctx = await buildUserContext(fakeReq)

        expect(ctx.user.sub).toBe('findadocSubTest')
        expect(ctx.user.name).toBe('FindaDocName')
        expect(ctx.user.email).toBe('findadocSubTest@FindadocSubTest.com')
        expect(ctx.user.scope).toBe('read:profile write:posts')
        expect(ctx.user.roles).toContain(Role.User)
    })

    it('should fallback to standard roles claim if custom claim missing', async () => {
        const fakeReq = { user: { sub: 'fallbackStandardSub',
            name: 'fallbackStandardSub',
            email: 'fallbackStandardSub@fallbackStandardSub.com',
            scope: 'read:facilities',
            roles: [Role.Moderator] } } as FastifyRequest
        const ctx = await buildUserContext(fakeReq)

        expect(ctx.user.roles).toContain(Role.Moderator)
    })

    it('should default to empty roles if none provided', async () => {
        const fakeReq = { user: { sub: 'noRoleSub', name: 'NoRole', email: 'norole@norole.com', scope: '' } } as FastifyRequest
        const ctx = await buildUserContext(fakeReq)

        expect(ctx.user.roles).toEqual([])
    })
})
