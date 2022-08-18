
module.exports.run = async function (tap) {
    tap.test("Bluetooth test", async(t) => {
        t.ok(true, 'Bluetooth pass')

        t.test("btooth subtest", async(subtest) => {
            subtest.ok(true, 'Blutooth subtest passed!')
        })
    })
}