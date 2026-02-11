import unittest
import sys
import os

sys.path.append(
    os.path.abspath(
        os.path.join(os.path.dirname(__file__), "../../../src/qry-api/src")
    )
)

# setup environment variables...
os.environ["KEY"] = "xyz"
os.environ["CONFIG_PATH"] = config_path = os.path.join(os.path.dirname(__file__), "../../../src/qry-api/src/.config/openai_config.json")


class TestCore(unittest.TestCase):
    """Test core functions."""

    def test_placeholder(self):
        """Test placeholder."""
        self.assertIsNotNone({})


if __name__ == "__main__":
    unittest.main()
