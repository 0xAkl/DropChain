module file_share::registry {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;

    // ── Errors ───────────────────────────────────────────────────────
    const E_NOT_OWNER:       u64 = 1;
    const E_FILE_NOT_FOUND:  u64 = 2;
    const E_ACCESS_REVOKED:  u64 = 3;
    const E_FILE_EXPIRED:    u64 = 4;
    const E_MAX_VIEWS_HIT:   u64 = 5;
    const E_ALREADY_EXISTS:  u64 = 6;

    // ── Structs ──────────────────────────────────────────────────────

    struct FileRecord has store, drop, copy {
        cid:        String,   // Shelby content identifier
        name:       String,   // original filename
        size:       u64,      // bytes
        owner:      address,
        expiry_ts:  u64,      // Unix seconds; 0 = never
        max_views:  u64,      // 0 = unlimited
        views:      u64,
        revoked:    bool,
        created_at: u64,
    }

    struct FileRegistry has key {
        files:          vector<FileRecord>,
        register_events: EventHandle<RegisterEvent>,
        revoke_events:   EventHandle<RevokeEvent>,
        view_events:     EventHandle<ViewEvent>,
    }

    // ── Events ───────────────────────────────────────────────────────

    struct RegisterEvent has drop, store {
        cid:  String,
        name: String,
        owner: address,
        ts:   u64,
    }
    struct RevokeEvent has drop, store {
        cid: String,
        ts:  u64,
    }
    struct ViewEvent has drop, store {
        cid:   String,
        views: u64,
        ts:    u64,
    }

    // ── Init ─────────────────────────────────────────────────────────

    /// Called once per account to initialise their registry resource.
    public entry fun init_registry(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<FileRegistry>(addr)) {
            move_to(account, FileRegistry {
                files: vector::empty(),
                register_events: account::new_event_handle<RegisterEvent>(account),
                revoke_events:   account::new_event_handle<RevokeEvent>(account),
                view_events:     account::new_event_handle<ViewEvent>(account),
            });
        }
    }

    // ── Write functions ──────────────────────────────────────────────

    /// Register a new file after uploading to Shelby.
    public entry fun register_file(
        account:   &signer,
        cid:       String,
        name:      String,
        size:      u64,
        expiry_ts: u64,
        max_views: u64,
    ) acquires FileRegistry {
        let addr = signer::address_of(account);
        if (!exists<FileRegistry>(addr)) { init_registry(account); };

        let registry = borrow_global_mut<FileRegistry>(addr);

        // Reject duplicate CIDs
        let i = 0u64;
        let len = vector::length(&registry.files);
        while (i < len) {
            let f = vector::borrow(&registry.files, i);
            assert!(f.cid != cid, E_ALREADY_EXISTS);
            i = i + 1;
        };

        let now = timestamp::now_seconds();
        vector::push_back(&mut registry.files, FileRecord {
            cid, name, size, owner: addr,
            expiry_ts, max_views, views: 0,
            revoked: false, created_at: now,
        });

        event::emit_event(&mut registry.register_events, RegisterEvent {
            cid, name, owner: addr, ts: now,
        });
    }

    /// Revoke access — only the owner can call this.
    public entry fun revoke_file(
        account: &signer,
        cid:     String,
    ) acquires FileRegistry {
        let addr = signer::address_of(account);
        let registry = borrow_global_mut<FileRegistry>(addr);
        let idx = find_file_idx(&registry.files, &cid);
        assert!(idx < vector::length(&registry.files), E_FILE_NOT_FOUND);

        let f = vector::borrow_mut(&mut registry.files, idx);
        assert!(f.owner == addr, E_NOT_OWNER);
        f.revoked = true;

        let now = timestamp::now_seconds();
        event::emit_event(&mut registry.revoke_events, RevokeEvent { cid, ts: now });
    }

    /// Increment view count — called when a recipient fetches the file.
    public entry fun increment_views(
        caller: &signer,
        owner:  address,
        cid:    String,
    ) acquires FileRegistry {
        let registry = borrow_global_mut<FileRegistry>(owner);
        let idx = find_file_idx(&registry.files, &cid);
        assert!(idx < vector::length(&registry.files), E_FILE_NOT_FOUND);

        let f = vector::borrow_mut(&mut registry.files, idx);
        assert!(!f.revoked, E_ACCESS_REVOKED);

        let now = timestamp::now_seconds();
        if (f.expiry_ts > 0) { assert!(now < f.expiry_ts, E_FILE_EXPIRED); };
        if (f.max_views  > 0) { assert!(f.views < f.max_views, E_MAX_VIEWS_HIT); };

        f.views = f.views + 1;

        event::emit_event(&mut registry.view_events, ViewEvent {
            cid, views: f.views, ts: now,
        });
    }

    // ── View (read-only) functions ───────────────────────────────────

    #[view]
    public fun get_file(owner: address, cid: String): FileRecord acquires FileRegistry {
        let registry = borrow_global<FileRegistry>(owner);
        let idx = find_file_idx(&registry.files, &cid);
        assert!(idx < vector::length(&registry.files), E_FILE_NOT_FOUND);
        *vector::borrow(&registry.files, idx)
    }

    #[view]
    public fun is_accessible(owner: address, cid: String): bool acquires FileRegistry {
        let registry = borrow_global<FileRegistry>(owner);
        let idx = find_file_idx(&registry.files, &cid);
        if (idx >= vector::length(&registry.files)) return false;
        let f = vector::borrow(&registry.files, idx);
        if (f.revoked) return false;
        let now = timestamp::now_seconds();
        if (f.expiry_ts > 0 && now >= f.expiry_ts) return false;
        if (f.max_views  > 0 && f.views >= f.max_views) return false;
        true
    }

    #[view]
    public fun file_count(owner: address): u64 acquires FileRegistry {
        let registry = borrow_global<FileRegistry>(owner);
        vector::length(&registry.files)
    }

    // ── Internal helpers ─────────────────────────────────────────────

    fun find_file_idx(files: &vector<FileRecord>, cid: &String): u64 {
        let i = 0u64;
        let len = vector::length(files);
        while (i < len) {
            if (&vector::borrow(files, i).cid == cid) return i;
            i = i + 1;
        };
        len // sentinel: not found
    }
}
