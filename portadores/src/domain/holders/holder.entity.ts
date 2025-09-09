import { validate } from 'gerador-validador-cpf';

export class InvalidCpfError extends Error {
    constructor() {
        super('CPF inválido');
        this.name = 'InvalidCpfError';
    }
}

export class Holder {
    id: string;
    name: string;
    cpf: string;
    createdAt: Date;
    updatedAt: Date;

    private constructor(props: Partial<Holder>) {
        Object.assign(this, props);
    }

    /**
     * Creates a new Holder entity instance.
     * Validates business rules, such as CPF validity.
     */
    public static create(props: { name: string; cpf: string }): Holder {
        if (!validate(props.cpf)) {
            throw new InvalidCpfError();
        }

        return new Holder({
            name: props.name,
            cpf: props.cpf,
        });
    }

    /**
     * Re-creates an existing Holder entity from database data.
     * Use this when you have fetched data and need a "rich" domain object with methods.
     */
    public static reconstitute(props: {
        id: string;
        name: string;
        cpf: string;
        createdAt: Date;
        updatedAt: Date;
    }): Holder {
        return new Holder(props);
    }
}