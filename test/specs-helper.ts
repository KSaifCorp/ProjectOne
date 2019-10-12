import * as bcrypt from 'bcrypt'

import { User } from "../src/models/user.model"
import { Role } from "../src/models/role.model"
import { Permission } from "../src/models/permission.model"


export class SPECSHelper {

    public static async teardown() {
        await Role.deleteMany({
            _id: { $in: ['5d7fa82ea8f55f6267a3a1a7', '5d7fa82ea8f55f6267a3a1a8', '5d7fa82ea8f55f6267a3a1a9'] }
        })

        await User.deleteMany({
            _id: {
                $in: ['9ca0df5f86abeb66da97ba5d', '9ca0df5f86abeb66da97ba5e', '1ca0df5f86abeb66da97ba61', '9ca0df5f86abeb66da97ba5f', '1ca0df5f86abeb66da97ba60']
            }
        })

        await Permission.deleteMany({
            _id: {
                $in: ['5e4af031d38caee014ab4cb2', '5e4af031d38caee014ab4cb3', '5e4af031d38caee014ab4cb4',
                    '5e4af031d38caee014ab4cb5', '5e4af031d38caee014ab4ca1', '5e4af031d38caee014ab4ca2',
                    '5e4af031d38caee014ab4ca3']
            }
        })
    }

    public static async setup() {

        await Permission.create(
            [
                {
                    _id: '5e4af031d38caee014ab4cb2',
                    name: 'Voir un équipement',
                    key: 'device.read'
                },
                {
                    _id: '5e4af031d38caee014ab4cb3',
                    name: 'Créer un équipement',
                    key: 'device.create'
                },
                {
                    _id: '5e4af031d38caee014ab4cb4',
                    name: 'Modifier un équipement',
                    key: 'device.edit'
                },
                {
                    _id: '5e4af031d38caee014ab4cb5',
                    name: 'Supprimer un équipement',
                    key: 'device.delete'
                },
                {
                    _id: '5e4af031d38caee014ab4ca1',
                    name: 'Créer un groupe',
                    key: 'group.create'
                },
                {
                    _id: '5e4af031d38caee014ab4ca2',
                    name: 'Administrateur',
                    key: 'admin'
                },
                {
                    _id: '5e4af031d38caee014ab4ca3',
                    name: 'Voir un groupe',
                    key: 'group.read'
                }
            ]
        )

        await Role.create(
            [
                {
                    _id: '5d7fa82ea8f55f6267a3a1a7',
                    name: 'Admin',
                    permissions: ['5e4af031d38caee014ab4ca2']
                },
                {
                    _id: '5d7fa82ea8f55f6267a3a1a8',
                    name: 'Gardien',
                    permissions: ['5e4af031d38caee014ab4cb2', '5e4af031d38caee014ab4ca3']
                },
                {
                    _id: '5d7fa82ea8f55f6267a3a1a9',
                    name: '@tous',
                    permissions: ['5e4af031d38caee014ab4cb2', '5e4af031d38caee014ab4ca3']
                }
            ]
        )

        await User.create([
            {
                _id: '9ca0df5f86abeb66da97ba5d',
                name: 'Ash Ketchum',
                email: 'ash@pokemon.com',
                password: await bcrypt.hash('Pikachu', 10),
                perimeter: [],
                signupToken: null
            },
            {
                _id: '9ca0df5f86abeb66da97ba5e',
                name: 'Gary Oak',
                email: 'gary@pokemon.com',
                password: await bcrypt.hash('Rattata', 10),
                perimeter: [
                    {
                        roles: ['5d7fa82ea8f55f6267a3a1a6', '5d7fa82ea8f55f6267a3a1a7']
                    }
                ]
            },
            {
                _id: '1ca0df5f86abeb66da97ba61',
                name: 'crystal',
                email: 'crystal@pokemon.com',
                password: null,
                perimeter: [
                    {
                        entity: '5d7fae50fba63a6ed0b46a2c',
                        isDefault: true,
                        groups: ['8da1e01fda34eb8c1b9db471'],
                        devices: [],
                        roles: []
                    }
                ],
                signupToken: '82FFbX8Qk6jwBy73HBANvmHtz0yHtn5kGI0qRREQACFS4atx8G'
            },
            {
                _id: '9ca0df5f86abeb66da97ba5f',
                name: 'Red',
                email: 'red@pokemon.com',
                password: await bcrypt.hash('Charizard', 10),
                perimeter: [
                    {

                        roles: ['5d7fa82ea8f55f6267a3a1a6', '5d7fa82ea8f55f6267a3a1a7']
                    }
                ],
                resetToken: 'hLa1uzeZaGcWtzpVYRRiCEOXzxlhUIJblOQO1eBS8HdcBAsjU0'
            },
            {
                _id: '1ca0df5f86abeb66da97ba60',
                name: 'Blue',
                email: 'blue@pokemon.com',
                password: await bcrypt.hash('Blastoise', 10),
                perimeter: [
                    {
                        roles: []
                    }
                ],
                isStaff: true
            },
        ])

    }
}

const specsHelper = new SPECSHelper()
export default specsHelper
