import { expect } from "chai"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import type { ColumnType } from "../../../src/driver/types/ColumnTypes"
import type { ColumnMetadata } from "../../../src/metadata/ColumnMetadata"

describe("driver > getColumnLength", () => {
    // Minimal driver instances via Object.create to avoid constructor
    // side effects — getColumnLength reads withLengthColumnTypes and calls
    // normalizeType, which carries no instance state.
    const build = (ctor: { prototype: object }) => {
        const driver = Object.create(ctor.prototype)
        driver.withLengthColumnTypes = [
            "character varying",
            "varchar",
        ] as ColumnType[]
        return driver as { getColumnLength(column: ColumnMetadata): string }
    }

    const column = (options: Partial<ColumnMetadata>) =>
        options as ColumnMetadata

    const drivers: [
        string,
        { getColumnLength(column: ColumnMetadata): string },
    ][] = [
        ["PostgresDriver", build(PostgresDriver)],
        ["CockroachDriver", build(CockroachDriver)],
    ]

    for (const [name, driver] of drivers) {
        describe(name, () => {
            it("reports a length for a type that accepts one", () => {
                expect(
                    driver.getColumnLength(
                        column({ type: "varchar", length: "255" }),
                    ),
                ).to.equal("255")
            })

            it("reports a length for a type given as a constructor", () => {
                // the type reaching this method is not always normalized, so a
                // `@Column({ length: 255 })` on a string property arrives as
                // String and must still report its length
                expect(
                    driver.getColumnLength(
                        column({ type: String, length: "255" }),
                    ),
                ).to.equal("255")
            })

            it("ignores a length carried by a type that accepts none", () => {
                expect(
                    driver.getColumnLength(
                        column({ type: "uuid", length: "36" }),
                    ),
                ).to.equal("")
            })

            it("reports no length when none is set", () => {
                expect(
                    driver.getColumnLength(column({ type: "uuid" })),
                ).to.equal("")
            })

            it("reports no length for a length-accepting type without one", () => {
                expect(
                    driver.getColumnLength(column({ type: "varchar" })),
                ).to.equal("")
            })
        })
    }
})
