import { expect } from "chai"
import { CockroachDriver } from "../../../src/driver/cockroachdb/CockroachDriver"
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver"
import type { ColumnType } from "../../../src/driver/types/ColumnTypes"
import type { TableColumn } from "../../../src/schema-builder/table/TableColumn"

describe("driver > createFullType", () => {
    // Minimal driver instances via Object.create to avoid constructor
    // side effects — createFullType reads withLengthColumnTypes and
    // spatialTypes only.
    const build = (ctor: { prototype: object }) => {
        const driver = Object.create(ctor.prototype)
        driver.withLengthColumnTypes = [
            "character varying",
            "varchar",
        ] as ColumnType[]
        driver.spatialTypes = ["geometry", "geography"] as ColumnType[]
        return driver as { createFullType(column: TableColumn): string }
    }

    const column = (options: Partial<TableColumn>) => options as TableColumn

    const drivers: [string, { createFullType(column: TableColumn): string }][] =
        [
            ["PostgresDriver", build(PostgresDriver)],
            ["CockroachDriver", build(CockroachDriver)],
        ]

    for (const [name, driver] of drivers) {
        describe(name, () => {
            it("renders a length for a type that accepts one", () => {
                expect(
                    driver.createFullType(
                        column({ type: "varchar", length: "255" }),
                    ),
                ).to.equal("varchar(255)")
            })

            it("ignores a length carried by a type that accepts none", () => {
                expect(
                    driver.createFullType(
                        column({ type: "uuid", length: "36" }),
                    ),
                ).to.equal("uuid")
            })

            it("renders no length when none is set", () => {
                expect(
                    driver.createFullType(column({ type: "uuid" })),
                ).to.equal("uuid")
            })

            it("still renders precision and scale", () => {
                expect(
                    driver.createFullType(
                        column({ type: "numeric", precision: 5, scale: 2 }),
                    ),
                ).to.equal("numeric(5,2)")
            })

            it("still renders precision alone", () => {
                expect(
                    driver.createFullType(
                        column({ type: "numeric", precision: 5 }),
                    ),
                ).to.equal("numeric(5)")
            })
        })
    }
})
